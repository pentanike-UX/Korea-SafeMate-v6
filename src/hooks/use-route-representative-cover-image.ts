"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import type { ContentPost } from "@/types/domain";
import { getRouteExploreCardImageAlt, routeRepresentativeSpot } from "@/lib/content-post-route";
import { buildLocalPostVisualPlan } from "@/lib/post-local-images";
import { buildSpotImageQuery } from "@/lib/spot-image-query";
import { readNaverImageQueryCache, writeNaverImageQueryCache } from "@/lib/naver-image-query-cache";
import { getRouteExploreCardCoverUrl } from "@/lib/spot-image-gallery";
import {
  mapNaverImageSearchItemsToCandidates,
  type NaverImageSearchApiItem,
} from "@/lib/naver-image-api-mapper";

/**
 * 대표 스팟·route hero·갤러리 1장 — `getRouteExploreCardCoverUrl` + 24h 쿼리 캐시.
 */
export function useRouteRepresentativeCoverImage(post: ContentPost) {
  const [naverItems, setNaverItems] = useState<ReturnType<typeof mapNaverImageSearchItemsToCandidates> | null>(null);
  const [bypassNaver, setBypassNaver] = useState(false);

  const rep = useMemo(() => routeRepresentativeSpot(post), [post]);
  const plan = useMemo(() => buildLocalPostVisualPlan(post), [post]);

  const query = useMemo(
    () => (rep ? buildSpotImageQuery(rep, { regionSlug: post.region_slug, postTitle: post.title }) : ""),
    [rep, post.region_slug, post.title],
  );

  useEffect(() => {
    startTransition(() => setBypassNaver(false));
  }, [post.id]);

  useEffect(() => {
    if (!rep || !query.trim() || bypassNaver) {
      if (!rep) startTransition(() => setNaverItems(null));
      return;
    }

    const cached = readNaverImageQueryCache(query);
    if (cached?.items?.length) {
      startTransition(() =>
        setNaverItems(mapNaverImageSearchItemsToCandidates(cached.items as NaverImageSearchApiItem[])),
      );
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      query,
      display: "10",
      sort: "sim",
      filter: "medium",
    });
    if (rep.real_place_name?.trim()) params.set("realPlaceName", rep.real_place_name.trim());
    if (rep.district?.trim()) params.set("district", rep.district.trim());
    if (rep.spot_name?.trim()) params.set("spotName", rep.spot_name.trim());
    if (rep.display_name?.trim()) params.set("displayName", rep.display_name.trim());
    if (!rep.spot_name?.trim() && rep.title?.trim()) params.set("spotName", rep.title.trim());

    fetch(`/api/naver/image-search?${params}`)
      .then((r) => r.json())
      .then((j: { items?: NaverImageSearchApiItem[]; unavailable?: boolean }) => {
        if (cancelled) return;
        if (j.unavailable) {
          startTransition(() => setNaverItems(null));
          return;
        }
        const items = j.items ?? [];
        startTransition(() => {
          if (items.length > 0) {
            writeNaverImageQueryCache(query, items);
            setNaverItems(mapNaverImageSearchItemsToCandidates(items));
          } else setNaverItems(null);
        });
      })
      .catch(() => {
        if (!cancelled) startTransition(() => setNaverItems(null));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rep 필드로 의존성 고정 (객체 참조 불안정)
  }, [
    rep?.id,
    query,
    bypassNaver,
    rep?.real_place_name,
    rep?.district,
    rep?.spot_name,
    rep?.display_name,
    rep?.title,
  ]);

  const url = useMemo(() => {
    if (!rep) return plan.hero;
    if (bypassNaver) {
      return getRouteExploreCardCoverUrl(post, rep, { plan, clientNaverItems: null });
    }
    return getRouteExploreCardCoverUrl(post, rep, { plan, clientNaverItems: naverItems });
  }, [rep, post, plan, naverItems, bypassNaver]);

  const alt = useMemo(() => getRouteExploreCardImageAlt(post), [post]);

  const onCoverImgError = useCallback(() => {
    if (!bypassNaver) setBypassNaver(true);
  }, [bypassNaver]);

  return { url, alt, onCoverImgError };
}
