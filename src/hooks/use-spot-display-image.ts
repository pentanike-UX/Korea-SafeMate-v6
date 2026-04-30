"use client";

import { useEffect, useMemo, useState } from "react";
import type { ContentPost, RouteSpot } from "@/types/domain";
import {
  getSpotDisplayImageAlt,
  getSpotDisplayImageUrl,
  type SpotImageOpts,
} from "@/lib/content-post-route";
import { readLocalSelectedImage } from "@/lib/spot-image-local-selection";

/**
 * 상세 스팟 이미지 — 서버 데이터 + 슈퍼관리자 localStorage 대표 선택 병합.
 * Supabase 저장 시 localStorage는 대체 예정(동일 키를 API로 이전 가능).
 */
export function useSpotDetailImage(spot: RouteSpot, post: ContentPost, opts?: SpotImageOpts) {
  const [mounted, setMounted] = useState(false);
  const [pickTick, setPickTick] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseUrl = useMemo(() => getSpotDisplayImageUrl(spot, post, opts), [spot, post, opts]);

  const url = useMemo(() => {
    if (!mounted) return baseUrl;
    const ls = readLocalSelectedImage(spot.id);
    return ls ?? baseUrl;
  }, [mounted, spot.id, baseUrl, pickTick]);

  const alt = useMemo(() => getSpotDisplayImageAlt(spot, post, opts), [spot, post, opts]);

  const onAdminImagePicked = () => setPickTick((n) => n + 1);

  return { url, alt, onAdminImagePicked };
}
