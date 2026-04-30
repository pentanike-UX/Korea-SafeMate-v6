"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import type { ContentPost } from "@/types/domain";
import { getRouteExploreCardImageAlt, routeRepresentativeSpot } from "@/lib/content-post-route";
import { buildLocalPostVisualPlan } from "@/lib/post-local-images";
import { getRouteExploreCardCoverUrl } from "@/lib/spot-image-gallery";
import { useNaverSpotImages } from "@/hooks/use-naver-spot-images";

/**
 * 대표 스팟 — Local Entity + 정제 이미지 검색 → `getRouteExploreCardCoverUrl`.
 */
export function useRouteRepresentativeCoverImage(post: ContentPost) {
  const [bypassNaver, setBypassNaver] = useState(false);
  const rep = useMemo(() => routeRepresentativeSpot(post), [post]);
  const plan = useMemo(() => buildLocalPostVisualPlan(post), [post]);
  const pipe = useNaverSpotImages(rep, post);

  useEffect(() => {
    startTransition(() => setBypassNaver(false));
  }, [post.id]);

  const url = useMemo(() => {
    if (!rep) return plan.hero;
    if (bypassNaver) {
      return getRouteExploreCardCoverUrl(post, rep, { plan, clientNaverCandidates: null });
    }
    return getRouteExploreCardCoverUrl(post, rep, {
      plan,
      clientNaverCandidates: pipe.mergedItems,
      ...(pipe.pipelineDone ? { primaryPlace: pipe.primaryPlace } : {}),
    });
  }, [rep, post, plan, pipe.mergedItems, pipe.primaryPlace, pipe.pipelineDone, bypassNaver]);

  const alt = useMemo(() => getRouteExploreCardImageAlt(post), [post]);

  const onCoverImgError = useCallback(() => {
    if (!bypassNaver) setBypassNaver(true);
  }, [bypassNaver]);

  return { url, alt, onCoverImgError };
}
