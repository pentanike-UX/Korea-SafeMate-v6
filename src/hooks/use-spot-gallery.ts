"use client";

import { useEffect, useMemo } from "react";
import type { ContentPost, RouteSpot } from "@/types/domain";
import { buildSpotGallerySlides } from "@/lib/spot-image-gallery";
import type { SpotImageOpts } from "@/lib/content-post-route";
import { useGooglePlacePhotos } from "@/hooks/use-google-place-photos";
import { useNaverSpotImages } from "@/hooks/use-naver-spot-images";
import { primaryImageQueryLabel } from "@/lib/spot-image-queries-refined";

/**
 * 스팟 갤러리 — Local Entity 확정 → 정제 이미지 검색어 → 관련도 정렬.
 * `fetchRemote: false` — 무료 티저 등에서 이미지·네이버 호출 생략.
 */
export function useSpotGallery(
  spot: RouteSpot,
  post: ContentPost,
  opts?: SpotImageOpts & { fetchRemote?: boolean },
) {
  const fetchRemote = opts?.fetchRemote !== false;
  const pipe = useNaverSpotImages(spot, post, { enabled: fetchRemote });
  const googlePix = useGooglePlacePhotos(spot, post, fetchRemote);

  const slides = useMemo(() => {
    const rest = opts ? { ...opts } : {};
    delete (rest as { fetchRemote?: boolean }).fetchRemote;
    delete (rest as { clientGooglePhotoUrls?: unknown }).clientGooglePhotoUrls;
    return buildSpotGallerySlides(spot, post, {
      ...rest,
      suppressVisuals: !fetchRemote,
      clientNaverCandidates: fetchRemote ? pipe.mergedItems : null,
      clientGooglePhotoUrls:
        fetchRemote && googlePix.googlePhotosDone ? googlePix.photoUris : undefined,
      ...(fetchRemote && pipe.pipelineDone ? { primaryPlace: pipe.primaryPlace } : {}),
    });
  }, [
    spot,
    post,
    opts,
    fetchRemote,
    pipe.mergedItems,
    pipe.primaryPlace,
    pipe.pipelineDone,
    googlePix.photoUris,
    googlePix.googlePhotosDone,
  ]);

  useEffect(() => {
    if (!fetchRemote) return;
    const sourceCount = slides.reduce<Record<string, number>>((acc, s) => {
      acc[s.source] = (acc[s.source] ?? 0) + 1;
      return acc;
    }, {});
    const sourceOrder = Object.keys(sourceCount).sort();
    const chosen = slides[0]?.source ?? "none";
    console.info("[spot-gallery:client] gallery_debug", {
      spotId: spot.id,
      spotLabel: spot.real_place_name ?? spot.spot_name ?? spot.title,
      galleryCount: slides.length,
      imageSource: chosen,
      sourceBreakdown: sourceOrder.map((k) => `${k}:${sourceCount[k]}`).join(","),
    });
  }, [fetchRemote, slides, spot.id, spot.real_place_name, spot.spot_name, spot.title]);

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
