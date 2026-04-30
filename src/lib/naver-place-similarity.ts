/**
 * 네이버 Local Search 결과 vs 스팟 — 유사도 점수 (primaryPlace 확정용)
 */
import type { RouteSpot } from "@/types/domain";

/** 스코어링에 실제로 쓰는 필드만 (RouteSpot 또는 resolve API 쿼리). */
export type PlaceSimilarityInput = Pick<
  RouteSpot,
  "real_place_name" | "spot_name" | "display_name" | "district" | "title" | "category"
>;

export type LocalSearchItemForScore = {
  title: string;
  category: string;
  address: string;
  roadAddress: string;
  link: string;
};

export function normalizePlaceTitle(t: string): string {
  return t.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function norm(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

function spotExpectsCafeCoffee(spot: PlaceSimilarityInput & { what_to_do?: string }): boolean {
  const blob = `${spot.category ?? ""} ${spot.title ?? ""} ${spot.real_place_name ?? ""} ${spot.what_to_do ?? ""}`;
  return /카페|커피|베이커리|블루보틀|스타벅스|coffee/i.test(blob);
}

function categoryMismatchPenalty(spot: PlaceSimilarityInput, resultCategory: string): number {
  const rc = resultCategory.toLowerCase();
  if (spotExpectsCafeCoffee(spot)) {
    if (/병원|약국|학원|주유소/.test(rc) && !/카페|커피|음식|베이커리/.test(rc)) return 70;
  }
  return 0;
}

/**
 * 높을수록 동일 장소일 가능성 큼. 상위 1개를 primaryPlace로 쓴다.
 */
export function getPlaceSimilarityScore(
  spot: PlaceSimilarityInput,
  result: LocalSearchItemForScore,
  rankIndex: number,
): number {
  const rt = normalizePlaceTitle(result.title);
  if (!rt) return 0;

  let score = 0;

  const rp = spot.real_place_name?.trim() ?? "";
  const sn = spot.spot_name?.trim() ?? "";
  const dn = spot.display_name?.trim() ?? "";
  const pt = spot.title?.trim() ?? "";

  if (rp && rt === rp) score += 100;
  else if (rp && rt.includes(rp)) score += 72;
  else if (sn && (rt.includes(sn) || norm(rt).includes(norm(sn)))) score += 62;
  else if (dn && rt.includes(dn)) score += 52;
  else if (pt && rt.includes(pt) && pt.length >= 3) score += 38;

  const dist = spot.district?.trim();
  if (dist) {
    if (result.roadAddress.includes(dist) || result.address.includes(dist)) score += 24;
    else if (/강남|광화|종로|마포|송파|역삼|테헤란/.test(dist)) {
      const short = dist.replace(/역권|권$/, "").slice(0, 2);
      if (short.length >= 2 && (result.roadAddress.includes(short) || rt.includes(short))) score += 8;
    }
  }

  const spotCat = spot.category?.trim() ?? "";
  if (spotCat && result.category) {
    const leaf = spotCat.split(">").pop()?.trim()?.toLowerCase() ?? "";
    if (leaf && result.category.toLowerCase().includes(leaf)) score += 20;
  }

  score -= categoryMismatchPenalty(spot, result.category);

  if (result.link?.trim()) score += 10;

  score += Math.max(0, 5 - rankIndex) * 5;

  const nameBlob = [rp, sn, dn].filter(Boolean).join(" ");
  if (dist && !nameBlob && rt.includes(dist) && rt.length < 12) score -= 35;
  if (rp && !rt.includes(rp) && !sn && !dn && pt && !rt.includes(pt)) score -= 25;

  return score;
}

export function pickBestLocalMatch(
  spot: PlaceSimilarityInput,
  items: LocalSearchItemForScore[],
): { item: LocalSearchItemForScore; score: number; index: number } | null {
  if (!items.length) return null;
  let bestI = 0;
  let bestS = getPlaceSimilarityScore(spot, items[0], 0);
  for (let i = 1; i < items.length; i++) {
    const s = getPlaceSimilarityScore(spot, items[i], i);
    if (s > bestS) {
      bestS = s;
      bestI = i;
    }
  }
  /** 너무 낮으면 Entity 미확정 → 넓은 이미지 검색 폴백 */
  if (bestS < 42) return null;
  return { item: items[bestI], score: bestS, index: bestI };
}
