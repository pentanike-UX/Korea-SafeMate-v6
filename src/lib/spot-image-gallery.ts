/**
 * 스팟별 최종 갤러리 슬라이드 — 자동 선별·최대 10장
 */
import type { ContentPost, NaverImageCandidate, RouteSpot } from "@/types/domain";
import { mergeSpotNaverCandidates, type SpotImageOpts } from "@/lib/content-post-route";
import { buildLocalPostVisualPlan, isExternalPostImageUrl } from "@/lib/post-local-images";
import { spotDisplayName } from "@/lib/spot-image-query";
import { scoreAndSortNaverCandidates } from "@/lib/naver-image-quality";
import { scoreAndSortWithPrimaryPlace } from "@/lib/naver-image-relevance";
import { isHeritageHeroStrongCandidate } from "@/lib/spot-image-heritage";
import { isHeritageVisualStrategy, resolveSpotImagePlaceType } from "@/lib/spot-image-place-type";

export type SpotGallerySlide = {
  /** 표시 시도 순서: 원본 → 프록시 → 썸네일 */
  tryUrls: string[];
  thumbnail?: string;
  title?: string;
  alt: string;
  caption?: string;
  source: "naver-image" | "local" | "fallback" | "selected" | "hero";
  width?: number;
  height?: number;
  score?: number;
};

const MAX_GALLERY = 10;

/** heritage 타입: 시각 정체성 높은 후보를 앞으로 — 첫 장을 landmark 인지 가능 이미지로 */
function reorderHeritageGalleryHeroFirst<T extends NaverImageCandidate & { score: number }>(
  ranked: T[],
  spot: RouteSpot,
): T[] {
  const pt = resolveSpotImagePlaceType(spot);
  if (!isHeritageVisualStrategy(pt)) return ranked;
  const strong = ranked.filter((c) => isHeritageHeroStrongCandidate(c, spot, pt));
  const weak = ranked.filter((c) => !isHeritageHeroStrongCandidate(c, spot, pt));
  if (strong.length === 0) return ranked;
  return [...strong, ...weak];
}

function proxyUrl(original: string): string {
  return `/api/image-proxy?url=${encodeURIComponent(original)}`;
}

/** 단일 Naver 후보에서 표시 URL 후보 배열 (원본 link → 고해상 url → 프록시 → 썸네일 마지막) */
export function tryUrlsForNaverItem(c: NaverImageCandidate): string[] {
  const rawLink = (c.link ?? "").trim();
  const rawUrl = (c.url ?? "").trim();
  const thumb = c.thumbnail?.trim();
  const urls: string[] = [];
  const primary = rawLink || rawUrl;
  if (primary) {
    urls.push(primary);
    urls.push(proxyUrl(primary));
  }
  if (rawUrl && rawUrl !== primary) {
    urls.push(rawUrl);
    urls.push(proxyUrl(rawUrl));
  }
  if (thumb && thumb !== primary && thumb !== rawUrl) urls.push(thumb);
  return [...new Set(urls)];
}

export function galleryAltForSlide(spot: RouteSpot, titleHint?: string): string {
  const label = spotDisplayName(spot);
  if (titleHint?.trim()) {
    const t = titleHint.trim().slice(0, 48);
    return `${label} — ${t} 이미지`;
  }
  return `${label} 전경·현장 이미지`;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

/** 캡션: 장소와 무관한 기사 꼬리 제거 */
export function shortGalleryCaption(rawTitle: string | undefined): string | undefined {
  if (!rawTitle?.trim()) return undefined;
  let t = stripHtml(rawTitle);
  const pipe = t.indexOf("|");
  if (pipe > 0) t = t.slice(0, pipe);
  const br = t.indexOf("[");
  if (br > 0) t = t.slice(0, br);
  return t.trim().slice(0, 72) || undefined;
}

/**
 * 서버 데이터 + 클라이언트 Naver 결과로 슬라이드 목록 생성.
 */
export function buildSpotGallerySlides(
  spot: RouteSpot,
  post: ContentPost,
  opts: SpotImageOpts & { clientNaverItems?: NaverImageCandidate[] | null },
): SpotGallerySlide[] {
  if (opts.suppressVisuals) return [];
  const usePrimaryPipeline = Object.prototype.hasOwnProperty.call(opts, "primaryPlace");
  const plan = opts.plan ?? buildLocalPostVisualPlan(post);
  const slides: SpotGallerySlide[] = [];
  const seen = new Set<string>();

  const push = (s: SpotGallerySlide) => {
    const key = s.tryUrls[0] ?? "";
    if (!key || seen.has(key)) return;
    seen.add(key);
    slides.push(s);
  };

  if (spot.selected_image?.trim()) {
    const u = spot.selected_image.trim();
    push({
      tryUrls: [u],
      alt: galleryAltForSlide(spot, "선택 대표"),
      source: "selected",
    });
  }

  const clientItems =
    (opts as SpotImageOpts & { clientNaverItems?: NaverImageCandidate[] | null }).clientNaverItems ??
    opts.clientNaverCandidates;
  const merged = mergeSpotNaverCandidates(spot, clientItems);
  let ranked = usePrimaryPipeline
    ? scoreAndSortWithPrimaryPlace(merged, spot, opts.primaryPlace ?? null)
    : scoreAndSortNaverCandidates(merged, spot);
  ranked = reorderHeritageGalleryHeroFirst(ranked, spot);
  const roomNaver = MAX_GALLERY - slides.length;

  for (const c of ranked.slice(0, Math.max(0, roomNaver))) {
    const tryUrls = tryUrlsForNaverItem(c);
    if (tryUrls.length === 0) continue;
    const titleClean = stripHtml(c.title);
    const cap = shortGalleryCaption(c.title);
    const pw = parseInt(c.sizewidth ?? "", 10);
    const ph = parseInt(c.sizeheight ?? "", 10);
    push({
      tryUrls,
      thumbnail: c.thumbnail?.trim(),
      title: c.title,
      alt: galleryAltForSlide(spot, titleClean),
      caption: (cap ?? titleClean.slice(0, 80)) || undefined,
      source: "naver-image",
      width: c.width ?? (Number.isFinite(pw) ? pw : undefined),
      height: c.height ?? (Number.isFinite(ph) ? ph : undefined),
      score: c.score,
    });
  }

  const jsonGallery = spot.images?.gallery;
  if (Array.isArray(jsonGallery)) {
    for (const g of jsonGallery) {
      if (slides.length >= MAX_GALLERY) break;
      const u = g.url?.trim();
      if (!u) continue;
      const tries = [u, g.thumbnail?.trim()].filter(Boolean) as string[];
      const uniq = [...new Set(tries)];
      push({
        tryUrls: uniq.length ? uniq : [u],
        thumbnail: g.thumbnail,
        title: g.title,
        alt: galleryAltForSlide(spot, g.title),
        caption: g.title,
        source: g.source === "local" ? "local" : "naver-image",
        width: g.width,
        height: g.height,
        score: g.score,
      });
    }
  }

  if (slides.length < MAX_GALLERY && spot.images?.hero?.trim()) {
    const u = spot.images.hero.trim();
    push({
      tryUrls: [u],
      alt: galleryAltForSlide(spot, "대표 장면"),
      source: "hero",
    });
  }

  for (const u of spot.image_urls) {
    if (slides.length >= MAX_GALLERY) break;
    const x = u?.trim();
    if (!x) continue;
    push({
      tryUrls: [x],
      alt: galleryAltForSlide(spot, "현장"),
      source: "local",
    });
  }

  const planSpot = plan.spotImages.get(spot.id);
  if (planSpot && slides.length < MAX_GALLERY) {
    push({
      tryUrls: [planSpot],
      alt: galleryAltForSlide(spot),
      source: "fallback",
    });
  }

  if (slides.length === 0 && plan.hero) {
    push({
      tryUrls: [plan.hero],
      alt: post.title,
      source: "fallback",
    });
  }

  const fb = spot.images?.fallback?.trim();
  if (slides.length === 0 && fb) {
    push({
      tryUrls: [fb],
      alt: galleryAltForSlide(spot),
      source: "fallback",
    });
  }

  return slides.slice(0, MAX_GALLERY);
}

/**
 * 탐색 카드: 포스트 커버(로컬) → 대표 스팟 갤러리 첫 장 → 포스트 히어로
 */
export function getRouteExploreCardCoverUrl(
  post: ContentPost,
  rep: RouteSpot | null,
  opts: SpotImageOpts & { clientNaverItems?: NaverImageCandidate[] | null },
): string {
  const cover = post.cover_image_url?.trim();
  if (cover && !isExternalPostImageUrl(cover)) return cover;

  if (rep) {
    const slides = buildSpotGallerySlides(rep, post, opts);
    const first = slides[0]?.tryUrls[0];
    if (first) return first;
  }

  const plan = opts.plan ?? buildLocalPostVisualPlan(post);
  return plan.hero;
}
