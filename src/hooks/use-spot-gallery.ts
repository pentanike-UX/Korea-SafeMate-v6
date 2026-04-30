"use client";

import { useMemo } from "react";
import type { ContentPost, RouteSpot } from "@/types/domain";
import { buildSpotGallerySlides } from "@/lib/spot-image-gallery";
import type { SpotImageOpts } from "@/lib/content-post-route";
import { useNaverSpotImages } from "@/hooks/use-naver-spot-images";
import { primaryImageQueryLabel } from "@/lib/spot-image-queries-refined";

/**
 * 스팟 갤러리 — Local Entity 확정 → 정제 이미지 검색어 → 관련도 정렬.
 */
export function useSpotGallery(spot: RouteSpot, post: ContentPost, opts?: SpotImageOpts) {
  const pipe = useNaverSpotImages(spot, post);

  const slides = useMemo(
    () =>
      buildSpotGallerySlides(spot, post, {
        ...opts,
        clientNaverCandidates: pipe.mergedItems,
        ...(pipe.pipelineDone ? { primaryPlace: pipe.primaryPlace } : {}),
      }),
    [spot, post, opts, pipe.mergedItems, pipe.primaryPlace, pipe.pipelineDone],
  );

  const imageQueryLabel = useMemo(
    () => primaryImageQueryLabel(spot, pipe.primaryPlace, { regionSlug: post.region_slug, postTitle: post.title }),
    [spot, pipe.primaryPlace, post.region_slug, post.title],
  );

  const excludedApprox = Math.max(0, pipe.rawApiHits - pipe.uniqueMerged);

  const usedFallbackOnly =
    pipe.apiFailed ||
    ((pipe.mergedItems?.length ?? 0) === 0 && !(spot.image_candidates?.length ?? 0) && pipe.pipelineDone);

  return {
    slides,
    imageQuery: imageQueryLabel || pipe.localSearchQuery,
    imageQueriesTried: pipe.queriesTried,
    naverFetchedCount: pipe.mergedItems?.length ?? 0,
    usedFallbackOnly,
    primaryPlace: pipe.primaryPlace,
    placeSimilarityScore: pipe.primaryPlace?.similarityScore ?? null,
    searchQueryUsedForResolve: pipe.searchQueryUsedForResolve,
    usedBroadFallback: pipe.usedBroadFallback,
    excludedApprox,
    pipelineDone: pipe.pipelineDone,
  };
}
