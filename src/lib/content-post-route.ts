import type { ContentPost, ContentPostFormat, MapLatLng, RouteJourney, RouteSpot } from "@/types/domain";
import {
  buildLocalPostVisualPlan,
  isExternalPostImageUrl,
  localHeroAlt,
  localSpotAlt,
} from "@/lib/post-local-images";

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
 * 스팟 이미지 해상도 우선순위:
 * 1. 에디터 직접 업로드 (non-external image_urls)
 * 2. spot_catalog 연결된 typed 이미지 (hero primary) — catalogImages 제공 시
 * 3. buildLocalPostVisualPlan 기반 매핑 (지역 풀)
 */
export function getSpotDisplayImageUrl(spot: RouteSpot, post: ContentPost, opts?: SpotImageOpts): string {
  // 1. 에디터 직접 업로드
  const own = spot.image_urls.find((u) => u?.trim() && !isExternalPostImageUrl(u));
  if (own) return own.trim();

  // 2. spot_catalog 연결 이미지 (hero primary 우선, 없으면 hero 첫 번째)
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

  // 3. 지역 풀 기반 매핑
  const plan = opts?.plan ?? buildLocalPostVisualPlan(post);
  return plan.spotImages.get(spot.id) ?? plan.hero;
}

export function getSpotDisplayImageAlt(spot: RouteSpot, post: ContentPost, opts?: SpotImageOpts): string {
  const own = spot.image_urls.find((u) => u?.trim() && !isExternalPostImageUrl(u));
  if (own) return `${spot.title} — ${spot.place_name}`;
  const plan = opts?.plan ?? buildLocalPostVisualPlan(post);
  return localSpotAlt(spot, plan);
}

export function countPostsWithoutOwnMedia(posts: ContentPost[]): number {
  return posts.filter((p) => !postHasOwnVisualMedia(p)).length;
}
