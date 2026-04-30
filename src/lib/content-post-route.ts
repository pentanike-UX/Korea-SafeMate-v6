import type { ContentPost, ContentPostFormat, MapLatLng, RouteJourney, RouteSpot } from "@/types/domain";
import { buildLocalPostVisualPlan, isExternalPostImageUrl, localHeroAlt } from "@/lib/post-local-images";
import { spotDisplayName } from "@/lib/spot-image-query";

export function getContentPostFormat(post: ContentPost): ContentPostFormat {
  return post.post_format ?? "article";
}

export function postHasRouteJourney(post: ContentPost): boolean {
  return Boolean(post.route_journey && post.route_journey.spots.length > 0);
}

export function isRouteLikeFormat(format: ContentPostFormat): boolean {
  return format === "spot" || format === "route" || format === "hybrid";
}

export function routeJourneyPoints(journey: RouteJourney): MapLatLng[] {
  const fromPath = journey.path?.length ? journey.path : [];
  if (fromPath.length >= 2) return fromPath;
  return journey.spots.map((s) => ({ lat: s.lat, lng: s.lng }));
}

/** True when editor supplied non-external cover or spot uploads (paths under / or relative). */
export function postHasOwnVisualMedia(post: ContentPost): boolean {
  if (post.cover_image_url?.trim() && !isExternalPostImageUrl(post.cover_image_url)) return true;
  return Boolean(
    post.route_journey?.spots.some((s) => s.image_urls.some((x) => x?.trim() && !isExternalPostImageUrl(x))),
  );
}

/** Editor cover or first non-external spot image only (no auto mapping). */
export function postCoverImageUrl(post: ContentPost): string | null {
  const c = post.cover_image_url?.trim();
  if (c && !isExternalPostImageUrl(c)) return c;
  const first = post.route_journey?.spots
    .find((s) => s.image_urls.find((x) => x?.trim() && !isExternalPostImageUrl(x)))
    ?.image_urls.find((x) => x?.trim() && !isExternalPostImageUrl(x));
  return first?.trim() ?? null;
}

export { buildLocalPostVisualPlan };

/** List/cards + detail hero — `/mock/posts` 매핑 (외부 URL 무시). */
export function getPostHeroImageUrl(post: ContentPost): string {
  const own = postCoverImageUrl(post);
  if (own) return own;
  return buildLocalPostVisualPlan(post).hero;
}

/** 아티클 상세 보조 이미지 (루트 포스트는 보통 미사용). */
export function getPostSecondaryImageUrl(post: ContentPost): string | undefined {
  if (postCoverImageUrl(post)) return undefined;
  if (postHasRouteJourney(post)) return undefined;
  return buildLocalPostVisualPlan(post).secondary;
}

export function getPostHeroImageAlt(post: ContentPost): string {
  if (postCoverImageUrl(post)) return post.title;
  return localHeroAlt(post, buildLocalPostVisualPlan(post));
}

export function getPostSecondaryImageAlt(post: ContentPost): string | undefined {
  if (postCoverImageUrl(post) || postHasRouteJourney(post)) return undefined;
  const plan = buildLocalPostVisualPlan(post);
  if (!plan.secondary) return undefined;
  return `${post.title} — 추가 장면`;
}

export type SpotImageOpts = {
  /** When provided (e.g. route detail), avoids 재계산·스팟 간 중복 일관성. */
  plan?: ReturnType<typeof buildLocalPostVisualPlan>;
  /**
   * Server-side pre-fetched catalog image map (keyed by spot_catalog_id).
   * When a spot has `spot_catalog_id` and this map is provided, catalog images take priority
   * over local mock images — matching the "real place first" strategy.
   */
  catalogImages?: Map<string, { url: string; image_type: string; is_primary: boolean }[]>;
};

/**
 * 스팟 이미지 해상도 우선순위 (제품 스펙):
 *
 * 1. selected_image
 * 2. images.hero
 * 3. image_candidates[0].thumbnail (Naver 검색 캐시)
 * 4. 에디터 로컬 업로드 (image_urls)
 * 5. spot_catalog (DB 실장소)
 * 6. 지역 풀 mock — buildLocalPostVisualPlan
 */
export function getSpotDisplayImageUrl(spot: RouteSpot, post: ContentPost, opts?: SpotImageOpts): string {
  if (spot.selected_image?.trim()) return spot.selected_image.trim();

  if (spot.images?.hero?.trim()) return spot.images.hero.trim();

  const cand = spot.image_candidates?.[0]?.thumbnail?.trim();
  if (cand) return cand;

  const own = spot.image_urls.find((u) => u?.trim() && !isExternalPostImageUrl(u));
  if (own) return own.trim();

  if (spot.spot_catalog_id && opts?.catalogImages) {
    const imgs = opts.catalogImages.get(spot.spot_catalog_id);
    if (imgs && imgs.length > 0) {
      const primary = imgs.find((i) => i.image_type === "hero" && i.is_primary);
      if (primary) return primary.url;
      const anyHero = imgs.find((i) => i.image_type === "hero");
      if (anyHero) return anyHero.url;
      if (imgs[0]) return imgs[0].url;
    }
  }

  const plan = opts?.plan ?? buildLocalPostVisualPlan(post);
  return plan.spotImages.get(spot.id) ?? plan.hero;
}

/**
 * 스팟 이미지 alt — 실제 장소 인지 + 현장 느낌.
 * 예: "블루보틀 강남점 — 입구 외관 이미지"
 */
export function getSpotDisplayImageAlt(spot: RouteSpot, _post: ContentPost, _opts?: SpotImageOpts): string {
  const label = spotDisplayName(spot);
  if (spot.image_alt?.trim()) {
    const a = spot.image_alt.trim();
    if (/이미지\s*$/.test(a) || a.includes("—") || a.includes("·")) return a;
    return `${label} — ${a} 이미지`;
  }
  const hint = spot.short_description?.trim().slice(0, 36);
  if (hint) return `${label} — ${hint} 이미지`;
  return `${label} 외관·현장 이미지`;
}

/** 탐색 카드·목록용 대표 스팟 (featured 또는 첫 스팟). */
export function routeRepresentativeSpot(post: ContentPost): RouteSpot | null {
  const spots = post.route_journey?.spots;
  if (!spots?.length) return null;
  const sorted = [...spots].sort((a, b) => a.order - b.order);
  return sorted.find((s) => s.featured) ?? sorted[0] ?? null;
}

/**
 * /explore/routes 등 리스트 카드 — 대표 스팟 기반, 없으면 포스트 히어로.
 * 순서: 대표 스팟 파이프라인 → cover_image_url → getPostHeroImageUrl 폴백
 */
export function getRouteExploreCardImageUrl(post: ContentPost, opts?: SpotImageOpts): string {
  const rep = routeRepresentativeSpot(post);
  if (!rep) return getPostHeroImageUrl(post);

  const plan = opts?.plan ?? buildLocalPostVisualPlan(post);

  if (rep.selected_image?.trim()) return rep.selected_image.trim();
  if (rep.images?.hero?.trim()) return rep.images.hero.trim();

  const own = rep.image_urls.find((u) => u?.trim() && !isExternalPostImageUrl(u));
  if (own) return own.trim();

  if (rep.spot_catalog_id && opts?.catalogImages) {
    const imgs = opts.catalogImages.get(rep.spot_catalog_id);
    if (imgs?.length) {
      const primary = imgs.find((i) => i.image_type === "hero" && i.is_primary);
      if (primary) return primary.url;
      const anyHero = imgs.find((i) => i.image_type === "hero");
      if (anyHero) return anyHero.url;
      if (imgs[0]) return imgs[0].url;
    }
  }

  if (rep.image_candidates?.[0]?.thumbnail?.trim()) return rep.image_candidates[0].thumbnail.trim();

  const cover = post.cover_image_url?.trim();
  if (cover && !isExternalPostImageUrl(cover)) return cover;

  return plan.spotImages.get(rep.id) ?? plan.hero;
}

export function getRouteExploreCardImageAlt(post: ContentPost): string {
  const rep = routeRepresentativeSpot(post);
  if (rep) {
    return getSpotDisplayImageAlt(rep, post);
  }
  return getPostHeroImageAlt(post);
}

export function countPostsWithoutOwnMedia(posts: ContentPost[]): number {
  return posts.filter((p) => !postHasOwnVisualMedia(p)).length;
}
