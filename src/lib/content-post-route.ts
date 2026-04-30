import type {
  ContentPost,
  ContentPostFormat,
  MapLatLng,
  NaverImageCandidate,
  NaverPrimaryPlace,
  RouteJourney,
  RouteSpot,
} from "@/types/domain";
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
  /**
   * 클라이언트에서 /api/naver/image-search + 세션 캐시로 채운 후보.
   * `image_candidates`(JSON)보다 우선해 “방금 가져온 Naver”를 반영한다.
   */
  clientNaverCandidates?: NaverImageCandidate[] | null;
  /** Local Search로 확정한 장소 Entity — 이미지 관련도 점수에 사용(null은 미매칭). */
  primaryPlace?: NaverPrimaryPlace | null;
};

/**
 * Naver 후보에서 표시 URL 1개 — 고해상도 link/url 우선, 썸네일은 보조.
 */
export function firstUrlFromNaverCandidates(cands: NaverImageCandidate[] | null | undefined): string | null {
  if (!cands?.length) return null;
  for (const c of cands) {
    const u = (c.url ?? c.link)?.trim();
    if (u) return u;
  }
  for (const c of cands) {
    const orig = c.original?.trim();
    if (orig) return orig;
  }
  for (const c of cands) {
    const iu = c.imageUrl?.trim();
    if (iu) return iu;
  }
  for (const c of cands) {
    const t = c.thumbnail?.trim();
    if (t) return t;
  }
  return null;
}

export function mergeSpotNaverCandidates(
  spot: RouteSpot,
  client?: NaverImageCandidate[] | null,
): NaverImageCandidate[] {
  if (client && client.length > 0) return client;
  return spot.image_candidates ?? [];
}

function mergedNaverCandidates(
  spot: RouteSpot,
  client?: NaverImageCandidate[] | null,
): NaverImageCandidate[] {
  return mergeSpotNaverCandidates(spot, client);
}

/** 썸네일 로드 실패 시 — Naver·외부 URL 건너뛰고 시드/플랜으로 폴백 */
export function getSpotImageStaticFallbackChain(spot: RouteSpot, post: ContentPost, opts?: SpotImageOpts): string[] {
  const plan = opts?.plan ?? buildLocalPostVisualPlan(post);
  const raw = [
    spot.images?.hero?.trim(),
    ...spot.image_urls.map((u) => u?.trim()).filter(Boolean),
    post.cover_image_url?.trim() && !isExternalPostImageUrl(post.cover_image_url) ? post.cover_image_url.trim() : null,
    plan.spotImages.get(spot.id),
    plan.hero,
  ].filter(Boolean) as string[];
  return [...new Set(raw)];
}

/**
 * 스팟 이미지 해상도 (하루웨이·목록 공통):
 *
 * 1. selected_image
 * 2. `images.gallery[0]` · (clientNaverCandidates ?? image_candidates) — Naver 고해상도 link 우선
 * 3. images.hero (에디터 정적 히어로)
 * 4. 로컬 업로드 image_urls
 * 5. spot_catalog
 * 6. 포스트 cover (로컬·내부 경로일 때만)
 * 7. 지역 풀 mock — buildLocalPostVisualPlan
 *
 * Naver 실사진이 시드 `images.hero`보다 먼저 오도록 2번을 3번보다 앞에 둔다.
 */
export function getSpotImageDisplayUrl(spot: RouteSpot, post: ContentPost, opts?: SpotImageOpts): string {
  if (spot.selected_image?.trim()) return spot.selected_image.trim();

  const g0 = spot.images?.gallery?.[0]?.url?.trim();
  if (g0) return g0;

  const naverUrl = firstUrlFromNaverCandidates(mergedNaverCandidates(spot, opts?.clientNaverCandidates));
  if (naverUrl) return naverUrl;

  if (spot.images?.hero?.trim()) return spot.images.hero.trim();

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

  const cover = post.cover_image_url?.trim();
  if (cover && !isExternalPostImageUrl(cover)) return cover;

  const plan = opts?.plan ?? buildLocalPostVisualPlan(post);
  return plan.spotImages.get(spot.id) ?? plan.hero;
}

/** @deprecated 이름 통일: {@link getSpotImageDisplayUrl} */
export function getSpotDisplayImageUrl(spot: RouteSpot, post: ContentPost, opts?: SpotImageOpts): string {
  return getSpotImageDisplayUrl(spot, post, opts);
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
 * SSR 시에는 clientNaverCandidates 없음 → 클라이언트 래퍼에서 동일 훅으로 덮어쓴다.
 */
export function getRouteExploreCardImageUrl(post: ContentPost, opts?: SpotImageOpts): string {
  const rep = routeRepresentativeSpot(post);
  if (!rep) return getPostHeroImageUrl(post);

  const plan = opts?.plan ?? buildLocalPostVisualPlan(post);
  return getSpotImageDisplayUrl(rep, post, { ...opts, plan });
}

export function getRouteExploreCardImageAlt(post: ContentPost): string {
  const rep = routeRepresentativeSpot(post);
  if (rep) {
    return getSpotDisplayImageAlt(rep, post);
  }
  return getPostHeroImageAlt(post);
}

/** 카드·상세 공통 — 스팟 표시 URL 단일 진입점(별칭) */
export { getSpotImageDisplayUrl as getSpotImageForRoute };

export function countPostsWithoutOwnMedia(posts: ContentPost[]): number {
  return posts.filter((p) => !postHasOwnVisualMedia(p)).length;
}
