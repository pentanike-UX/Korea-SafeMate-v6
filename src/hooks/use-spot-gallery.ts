"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import type { ContentPost, NaverImageCandidate, RouteSpot } from "@/types/domain";
import { buildSpotImageQuery } from "@/lib/spot-image-query";
import { buildSpotGallerySlides } from "@/lib/spot-image-gallery";
import { readNaverImageQueryCache, writeNaverImageQueryCache } from "@/lib/naver-image-query-cache";
import type { SpotImageOpts } from "@/lib/content-post-route";
import {
  mapNaverImageSearchItemsToCandidates,
  type NaverImageSearchApiItem,
} from "@/lib/naver-image-api-mapper";

/**
 * 스팟 갤러리(최대 10) — Naver 자동 + 시드. 캐시 24h (`naver:image:*`).
 */
export function useSpotGallery(spot: RouteSpot, post: ContentPost, opts?: SpotImageOpts) {
  const [naverItems, setNaverItems] = useState<NaverImageCandidate[] | null>(null);
  const [apiFailed, setApiFailed] = useState(false);

  const query = useMemo(
    () => buildSpotImageQuery(spot, { regionSlug: post.region_slug, postTitle: post.title }),
    [spot, post.region_slug, post.title],
  );

  useEffect(() => {
    if (!query.trim()) return;
    const cached = readNaverImageQueryCache(query);
    if (cached?.items?.length) {
      startTransition(() => {
        setNaverItems(mapNaverImageSearchItemsToCandidates(cached.items as NaverImageSearchApiItem[]));
        setApiFailed(false);
      });
      return;
    }

    let cancelled = false;
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

    fetch(`/api/naver/image-search?${params}`)
      .then((r) => r.json())
      .then((j: { items?: NaverImageSearchApiItem[]; unavailable?: boolean }) => {
        if (cancelled) return;
        if (j.unavailable) {
          startTransition(() => {
            setApiFailed(true);
            setNaverItems(null);
          });
          return;
        }
        const items = j.items ?? [];
        startTransition(() => {
          if (items.length > 0) {
            writeNaverImageQueryCache(query, items);
            setNaverItems(mapNaverImageSearchItemsToCandidates(items));
          } else {
            setNaverItems(null);
          }
          setApiFailed(false);
        });
      })
      .catch(() => {
        if (!cancelled) {
          startTransition(() => {
            setApiFailed(true);
            setNaverItems(null);
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, spot.real_place_name, spot.district, spot.spot_name, spot.display_name, spot.title]);

  const slides = useMemo(
    () => buildSpotGallerySlides(spot, post, { ...opts, clientNaverItems: naverItems }),
    [spot, post, opts, naverItems],
  );

  const usedFallbackOnly =
    apiFailed || ((naverItems?.length ?? 0) === 0 && !(spot.image_candidates?.length ?? 0));

  return {
    slides,
    imageQuery: query,
    naverFetchedCount: naverItems?.length ?? 0,
    usedFallbackOnly,
  };
}
