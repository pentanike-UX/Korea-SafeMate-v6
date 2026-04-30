/**
 * Naver Image Search 후보 품질 점수·필터 (서버·클라이언트 공용)
 */
import type { NaverImageCandidate, RouteSpot } from "@/types/domain";

/** API 등에서 RouteSpot 전체 없이 점수만 낼 때 */
export type ImageScoreContext = {
  real_place_name?: string | null;
  spot_name?: string | null;
  display_name?: string | null;
  district?: string | null;
};

function contextFromSpot(spot: RouteSpot): ImageScoreContext {
  return {
    real_place_name: spot.real_place_name,
    spot_name: spot.spot_name,
    display_name: spot.display_name,
    district: spot.district,
  };
}

const NEGATIVE_TITLE =
  /사건|사고|시위|체포|논란|이전|철거|세척|공사|뉴스|속보|검찰|경찰|불법|혐의|사망|부상|화재|폭행|살인|성범죄|아이콘|로고|지도\s*캡|캡처|기자|보도|논의|해고|징계|기사|경제|매출|상권|공실|오픈|붐빈다|프랜차이즈|부동산|나무위키|위키미디어|wikimedia|위키\b|전세|월세|임대|분양/i;

const POSITIVE_TITLE =
  /전경|외관|입구|거리|정문|광장|야경|산책로|실내|창가|좌석|보행로|매장|내부|전망|궁|궁전|랜드마크|광장|광화문|한옥|거리 풍경/i;

const NEWSY =
  /…|\[|\]\s*|\d{4}\.\d{2}|\bYTN\b|\bKBS\b|\bMBC\b|연합|기사|특파원|보도자료|특집|인터뷰|칼럼/i;

/** 뉴스·위키 호스트 — 장소 사진이 아닐 가능성 높음 */
const NEWS_WIKI_HOST =
  /news\.|\.news\.|yna\.co|joins\.com|hani\.co|chosun\.com|donga\.com|mk\.co|wikimedia|namu\.wiki|wikitree|news\.naver\.com|media\.naver\.com/i;

const FACEY = /인물|얼굴|셀카|인스타|모델|화보|가수|배우|시상|팬싸|팬 사인/i;

function parseDim(s: string | undefined): number {
  if (!s) return 0;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
}

export function stripHtmlTitle(t: string): string {
  return t.replace(/<[^>]*>/g, "").trim();
}

/** 후보 제외 (하드 필터) */
export function shouldExcludeNaverCandidate(title: string, link: string, width: number, height: number): boolean {
  const t = title.trim();
  if (!t || t.length < 3) return true;
  if (NEGATIVE_TITLE.test(t)) return true;
  if (NEWSY.test(t) && t.length > 28) return true;
  if (FACEY.test(t)) return true;
  if (!link?.trim()) return true;
  if (NEWS_WIKI_HOST.test(link)) return true;
  // 극소 아이콘 추정
  if (width > 0 && height > 0 && width < 200 && height < 200) return true;
  return false;
}

/**
 * 점수 높을수록 우선. spot 컨텍스트 반영.
 */
export function getImageQualityScore(
  c: Pick<NaverImageCandidate, "title" | "link" | "thumbnail" | "sizewidth" | "sizeheight">,
  spotOrCtx: RouteSpot | ImageScoreContext,
): number {
  const ctx: ImageScoreContext =
    "order" in spotOrCtx ? contextFromSpot(spotOrCtx as RouteSpot) : (spotOrCtx as ImageScoreContext);

  const title = stripHtmlTitle(c.title);
  let score = 50;

  const w = parseDim(c.sizewidth);
  const h = parseDim(c.sizeheight);
  if (w >= 1200 && h >= 800) score += 35;
  else if (w >= 800 && h >= 500) score += 28;
  else if (w >= 600 && h >= 400) score += 18;
  else if (w >= 500 && h >= 300) score += 10;
  else if (w < 500 || h < 300) score -= 25;

  if (c.link?.trim()) score += 12;
  if (!c.thumbnail?.trim()) score -= 8;

  const rp = (ctx.real_place_name ?? "").trim();
  const sn = (ctx.spot_name ?? "").trim();
  const dn = (ctx.display_name ?? "").trim();
  const district = (ctx.district ?? "").trim();

  if (rp && title.includes(rp)) score += 22;
  if (sn && title.includes(sn)) score += 15;
  if (dn && title.includes(dn)) score += 12;
  if (district && title.includes(district)) score += 10;

  if (POSITIVE_TITLE.test(title)) score += 18;

  if (NEGATIVE_TITLE.test(title)) score -= 60;
  if (NEWSY.test(title)) score -= 20;
  if (FACEY.test(title)) score -= 25;

  if (title.length > 80) score -= 12;
  if (title.length > 120) score -= 15;

  if (/\.gif(\?|$)/i.test(c.link) && w < 400) score -= 30;

  return score;
}

export function scoreAndSortNaverCandidates(
  items: NaverImageCandidate[],
  spotOrCtx: RouteSpot | ImageScoreContext,
): Array<NaverImageCandidate & { score: number }> {
  const out: Array<NaverImageCandidate & { score: number }> = [];
  for (const c of items) {
    const title = stripHtmlTitle(c.title);
    const w = parseDim(c.sizewidth);
    const h = parseDim(c.sizeheight);
    if (shouldExcludeNaverCandidate(title, c.link ?? "", w, h)) continue;
    const score = getImageQualityScore(c, spotOrCtx);
    if (score < 15) continue;
    out.push({ ...c, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}
