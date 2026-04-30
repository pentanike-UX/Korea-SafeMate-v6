/**
 * 이미지 후보 vs 확정 장소 Entity(primaryPlace) 관련도 — 뉴스·상권·위키 등 감점
 */
import type { NaverImageCandidate, NaverPrimaryPlace, RouteSpot } from "@/types/domain";
import {
  getImageQualityScore,
  shouldExcludeNaverCandidate,
  stripHtmlTitle,
} from "@/lib/naver-image-quality";
import { normalizePlaceTitle } from "@/lib/naver-place-similarity";
import {
  heritageVisualIdentityScore,
  titleFailsHeritageVisualIdentity,
} from "@/lib/spot-image-heritage";
import { isHeritageVisualStrategy, resolveSpotImagePlaceType } from "@/lib/spot-image-place-type";

const NEWS_HOST_LINK = /news\.|yna\.|joins\.|hani\.|chosun\.|donga\.|wikimedia|namu\.wiki|news\.naver\.com/i;

function parseDim(s: string | undefined): number {
  if (!s) return 0;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
}

const IRRELEVANT =
  /상권|매출|공실|부동산|오피스텔|분양|임대|전세|월세|뉴스|속보|기사|경제|사건|시위|체포|논란|공사|철거|세척|오픈|붐빈다|프랜차이즈|나무위키|위키미디어|위키\b|wikimedia|한경|매일경제|부동산114|연합뉴스|특집|칼럼/i;

const POS_SCENE =
  /전경|외관|입구|실내|창가|좌석|정문|보행로|매장|내부|야경|광장|산책로|메뉴/i;

/**
 * primaryPlace가 있을 때 이미지 설명이 장소와 얼마나 맞는지.
 */
export function getImageRelevanceScore(
  c: Pick<NaverImageCandidate, "title" | "link" | "thumbnail" | "sizewidth" | "sizeheight">,
  primaryPlace: NaverPrimaryPlace | null,
  spot: RouteSpot,
): number {
  const title = stripHtmlTitle(c.title);
  let score = 35;

  const pt = primaryPlace ? normalizePlaceTitle(primaryPlace.title) : "";
  const rp = spot.real_place_name?.trim() ?? "";
  const road = primaryPlace?.roadAddress?.trim() ?? "";
  const dist = spot.district?.trim() ?? "";

  if (primaryPlace && pt) {
    if (title.includes(pt)) score += 45;
    else {
      const tok = pt.split(/\s+/).filter((w) => w.length >= 2).slice(0, 3);
      const hits = tok.filter((w) => title.includes(w)).length;
      score += hits * 12;
    }
    if (road) {
      const roadTok = road.replace(/^서울특별시\s*/, "").split(/\s/).filter((x) => x.length > 1)[0];
      if (roadTok && title.includes(roadTok)) score += 18;
    }
  }

  if (rp && title.includes(rp)) score += 28;
  if (dist && title.includes(dist)) score += 14;

  if (POS_SCENE.test(title)) score += 22;

  const w = parseDim(c.sizewidth);
  const h = parseDim(c.sizeheight);
  if (w >= 800 && h >= 500) score += 18;
  else if (w >= 500 && h >= 300) score += 8;
  else if (w > 0 && (w < 400 || h < 250)) score -= 22;

  if (c.link?.trim()) score += 8;

  if (IRRELEVANT.test(title)) score -= 85;

  if (primaryPlace && pt && !title.includes(pt.slice(0, Math.min(4, pt.length))) && IRRELEVANT.test(title)) {
    score -= 40;
  }

  if (/인물|셀카|얼굴|화보/.test(title)) score -= 35;

  return score;
}

export function shouldExcludeLowRelevance(
  title: string,
  primaryPlace: NaverPrimaryPlace | null,
  spot: RouteSpot,
): boolean {
  const t = stripHtmlTitle(title);
  if (IRRELEVANT.test(t)) return true;
  if (!primaryPlace) return false;
  const pt = normalizePlaceTitle(primaryPlace.title);
  if (!pt) return false;
  if (t.includes(pt)) return false;
  if (spot.real_place_name?.trim() && t.includes(spot.real_place_name.trim())) return false;
  const critical = /상권|매출|부동산|공실|오피스|뉴스속보/.test(t);
  return critical && !POS_SCENE.test(t);
}

/**
 * primaryPlace 유무에 따라 품질·관련도 결합 정렬.
 */
export function scoreAndSortWithPrimaryPlace(
  items: NaverImageCandidate[],
  spot: RouteSpot,
  primaryPlace: NaverPrimaryPlace | null,
): Array<NaverImageCandidate & { score: number }> {
  const placeType = resolveSpotImagePlaceType(spot);
  const heritage = isHeritageVisualStrategy(placeType);

  const out: Array<NaverImageCandidate & { score: number }> = [];
  for (const c of items) {
    const title = stripHtmlTitle(c.title);
    const w = parseDim(c.sizewidth);
    const h = parseDim(c.sizeheight);
    const link = (c.link ?? "").trim();
    if (shouldExcludeNaverCandidate(title, link, w, h)) continue;
    if (heritage && titleFailsHeritageVisualIdentity(c.title, link)) continue;
    if (link && NEWS_HOST_LINK.test(link) && !POS_SCENE.test(title)) continue;
    if (primaryPlace && shouldExcludeLowRelevance(title, primaryPlace, spot)) continue;

    const q = getImageQualityScore(c, spot);
    const r = getImageRelevanceScore(c, primaryPlace, spot);
    const identity = heritage ? heritageVisualIdentityScore(c.title, spot, primaryPlace, placeType) : 0;

    let score: number;
    if (heritage) {
      score = q * 0.2 + r * 0.28 + identity * 0.52;
    } else if (primaryPlace) {
      score = q * 0.35 + r * 0.65;
    } else {
      score = q;
    }

    const minCut = heritage ? 36 : primaryPlace ? 26 : 18;
    if (score < minCut) continue;
    out.push({ ...c, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}
