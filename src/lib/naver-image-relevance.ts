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

function parseDim(s: string | undefined): number {
  if (!s) return 0;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
}

const IRRELEVANT =
  /상권|매출|공실|부동산|오피스텔|분양|임대|뉴스|속보|사건|시위|체포|논란|공사|철거|세척|나무위키|위키미디어|위키\b|한경|매일경제|부동산114/i;

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
  const out: Array<NaverImageCandidate & { score: number }> = [];
  for (const c of items) {
    const title = stripHtmlTitle(c.title);
    const w = parseDim(c.sizewidth);
    const h = parseDim(c.sizeheight);
    if (shouldExcludeNaverCandidate(title, c.link ?? "", w, h)) continue;
    if (primaryPlace && shouldExcludeLowRelevance(title, primaryPlace, spot)) continue;

    const q = getImageQualityScore(c, spot);
    const r = getImageRelevanceScore(c, primaryPlace, spot);
    const score = primaryPlace ? q * 0.38 + r * 0.62 : q;
    if (score < 18) continue;
    out.push({ ...c, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}
