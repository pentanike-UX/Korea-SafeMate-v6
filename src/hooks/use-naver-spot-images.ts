"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import type { ContentPost, NaverImageCandidate, NaverPrimaryPlace, RouteSpot } from "@/types/domain";
import { buildLocalSearchApiQuery, buildRefinedImageQueries } from "@/lib/spot-image-queries-refined";
import { readNaverPlaceResolveCache, writeNaverPlaceResolveCache } from "@/lib/naver-place-resolve-cache";
import { readNaverImageQueryCache, writeNaverImageQueryCache } from "@/lib/naver-image-query-cache";
import {
  mapNaverImageSearchItemsToCandidates,
  type NaverImageSearchApiItem,
} from "@/lib/naver-image-api-mapper";

function buildResolveApiParams(spot: RouteSpot): URLSearchParams {
  const p = new URLSearchParams();
  if (spot.real_place_name?.trim()) p.set("realPlaceName", spot.real_place_name.trim());
  if (spot.spot_name?.trim()) p.set("spotName", spot.spot_name.trim());
  if (spot.display_name?.trim()) p.set("displayName", spot.display_name.trim());
  if (spot.district?.trim()) p.set("district", spot.district.trim());
  if (spot.address?.trim()) p.set("address", spot.address.trim());
  if (spot.road_address?.trim()) p.set("roadAddress", spot.road_address.trim());
  if (spot.title?.trim()) p.set("title", spot.title.trim());
  if (spot.category?.trim()) p.set("category", spot.category.trim());
  p.set("spotId", spot.id);
  return p;
}

async function fetchImageSearchItems(
  query: string,
  spot: RouteSpot,
  signal: AbortSignal,
): Promise<NaverImageCandidate[]> {
  const params = new URLSearchParams({
    query,
    display: "10",
    sort: "sim",
    filter: "medium",
  });
  if (spot.real_place_name?.trim()) params.set("realPlaceName", spot.real_place_name.trim());
  if (spot.district?.trim()) params.set("district", spot.district.trim());
  if (spot.spot_name?.trim()) params.set("spotName", spot.spot_name.trim());
  if (spot.display_name?.trim()) params.set("displayName", spot.display_name.trim());
  if (!spot.spot_name?.trim() && spot.title?.trim()) params.set("spotName", spot.title.trim());

  const res = await fetch(`/api/naver/image-search?${params}`, { signal });
  const j = (await res.json()) as { items?: NaverImageSearchApiItem[]; unavailable?: boolean };
  if (j.unavailable || !j.items?.length) return [];
  writeNaverImageQueryCache(query, j.items as unknown[]);
  return mapNaverImageSearchItemsToCandidates(j.items);
}

/**
 * Local → primaryPlace → 정제된 이미지 검색어들로 후보 병합 (클라이언트).
 * `enabled: false`면 네이버 호출 없음(무료 티저 등).
 */
export function useNaverSpotImages(
  spot: RouteSpot | null,
  post: ContentPost,
  opts?: { enabled?: boolean },
) {
  const enabled = opts?.enabled !== false;
  const [primaryPlace, setPrimaryPlace] = useState<NaverPrimaryPlace | null>(null);
  const [mergedItems, setMergedItems] = useState<NaverImageCandidate[] | null>(null);
  const [apiFailed, setApiFailed] = useState(false);
  const [pipelineDone, setPipelineDone] = useState(false);
  const [meta, setMeta] = useState({
    localSearchQuery: "",
    queriesTried: [] as string[],
    rawApiHits: 0,
    uniqueMerged: 0,
    usedBroadFallback: false,
    searchQueryUsedForResolve: "",
  });

  const resolveInputKey = useMemo(() => {
    if (!spot) return "";
    return buildLocalSearchApiQuery(spot, post.title);
  }, [spot, post.title]);

  const emptyMeta = useMemo(
    () => ({
      localSearchQuery: "",
      queriesTried: [] as string[],
      rawApiHits: 0,
      uniqueMerged: 0,
      usedBroadFallback: false,
      searchQueryUsedForResolve: "",
    }),
    [],
  );

  useEffect(() => {
    if (!spot || !enabled) return;

    let cancelled = false;
    const ac = new AbortController();

    async function run() {
      const spotNonNull = spot;
      if (!spotNonNull) return;

      setPipelineDone(false);
      setApiFailed(false);

      const localQ = buildLocalSearchApiQuery(spotNonNull, post.title);
      setMeta((m) => ({ ...m, localSearchQuery: localQ }));

      let pp: NaverPrimaryPlace | null = null;
      let searchUsed = localQ;

      const cached = readNaverPlaceResolveCache(spotNonNull.id, localQ);
      if (cached) {
        pp = cached.primaryPlace;
        searchUsed = cached.searchQueryUsed || localQ;
      } else {
        try {
          const res = await fetch(`/api/naver/resolve-primary-place?${buildResolveApiParams(spotNonNull)}`, {
            signal: ac.signal,
          });
          const j = (await res.json()) as {
            primaryPlace?: NaverPrimaryPlace | null;
            unavailable?: boolean;
            searchQueryUsed?: string;
          };
          if (cancelled) return;
          pp = j.primaryPlace ?? null;
          searchUsed = j.searchQueryUsed ?? localQ;
          writeNaverPlaceResolveCache(spotNonNull.id, localQ, {
            primaryPlace: pp,
            searchQueryUsed: searchUsed,
          });
        } catch {
          if (!cancelled) pp = null;
        }
      }

      const refined = buildRefinedImageQueries(spotNonNull, pp, {
        regionSlug: post.region_slug,
        postTitle: post.title,
      });
      const queries = refined.queries.filter((q) => q.trim().length > 0);
      setMeta((m) => ({
        ...m,
        usedBroadFallback: refined.mode === "broad_fallback",
        searchQueryUsedForResolve: searchUsed,
        queriesTried: queries,
      }));

      const byLink = new Map<string, NaverImageCandidate>();
      let rawHits = 0;

      for (const q of queries) {
        if (cancelled) return;
        if (byLink.size >= 55) break;

        let items: NaverImageCandidate[] = [];
        const imgCached = readNaverImageQueryCache(q);
        if (imgCached?.items?.length) {
          items = mapNaverImageSearchItemsToCandidates(imgCached.items as NaverImageSearchApiItem[]);
        } else {
          try {
            items = await fetchImageSearchItems(q, spotNonNull, ac.signal);
          } catch {
            items = [];
          }
        }

        rawHits += items.length;
        for (const it of items) {
          const key = (it.link ?? it.url ?? "").trim();
          if (key && !byLink.has(key)) byLink.set(key, it);
        }
      }

      if (cancelled) return;

      const arr = [...byLink.values()];
      startTransition(() => {
        setPrimaryPlace(pp);
        setMergedItems(arr.length ? arr : null);
        setMeta((m) => ({
          ...m,
          rawApiHits: rawHits,
          uniqueMerged: arr.length,
        }));
        setPipelineDone(true);
        if (!arr.length && queries.length === 0) setApiFailed(true);
      });
    }

    run();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [spot, enabled, post.title, post.region_slug, resolveInputKey]);

  return {
    primaryPlace: spot && enabled ? primaryPlace : null,
    mergedItems: spot && enabled ? mergedItems : null,
    apiFailed: spot && enabled ? apiFailed : false,
    pipelineDone: !spot || !enabled || pipelineDone,
    ...(spot && enabled ? meta : emptyMeta),
  };
}
