/**
 * 네이버 Local Entity(primaryPlace) 확정 후 이미지 검색어 — 넓은 상권/야경 쿼리 지양.
 */
import type { NaverPrimaryPlace, RouteSpot } from "@/types/domain";
import { buildSpotImageQuery, type BuildSpotImageQueryOpts } from "@/lib/spot-image-query";
import { normalizePlaceTitle } from "@/lib/naver-place-similarity";
import { buildHeritageVisualQueries } from "@/lib/spot-image-heritage";
import { isHeritageVisualStrategy, resolveSpotImagePlaceType } from "@/lib/spot-image-place-type";

function uniqShort(queries: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of queries) {
    const t = q.replace(/\s+/g, " ").trim();
    if (t.length < 3 || seen.has(t)) continue;
    seen.add(t);
    out.push(t.slice(0, 120));
  }
  return out;
}

/** Local Search API용 짧은 쿼리 (실장소명 + 지역/주소) */
export function buildLocalSearchApiQuery(spot: RouteSpot, postTitleFallback?: string): string {
  const name =
    spot.real_place_name?.trim() ||
    spot.spot_name?.trim() ||
    spot.display_name?.trim() ||
    spot.title?.trim() ||
    "";
  const dist = spot.district?.trim() ?? "";
  let q = `${name} ${dist}`.trim();
  if (q.length < 4) {
    q = [name, spot.road_address, spot.address].filter(Boolean).join(" ").trim();
  }
  if (q.length < 3 && postTitleFallback?.trim()) {
    q = postTitleFallback.trim().slice(0, 50);
  }
  return q.slice(0, 80);
}

/**
 * primaryPlace가 있으면 반드시 장소 Entity 기반 검색어만 반환한다.
 * 없으면 기존 `buildSpotImageQuery`(넓은 폴백) 단일 쿼리.
 */
export function buildRefinedImageQueries(
  spot: RouteSpot,
  primary: NaverPrimaryPlace | null,
  opts?: BuildSpotImageQueryOpts,
): { queries: string[]; mode: "entity" | "broad_fallback" } {
  const placeType = resolveSpotImagePlaceType(spot);

  if (primary && isHeritageVisualStrategy(placeType)) {
    const qs = buildHeritageVisualQueries(spot, primary, placeType);
    return { queries: qs.length ? qs : [], mode: "entity" };
  }

  if (primary) {
    const t = normalizePlaceTitle(primary.title);
    const road = primary.roadAddress?.trim();
    const dist = spot.district?.trim();
    const qs: string[] = [];

    if (road) qs.push(`${t} ${road}`);
    if (dist) qs.push(`${t} ${dist}`);
    qs.push(`${t} 외관`, `${t} 입구`, `${t} 거리`, `${t} 보행로`, `${t} 야경`);

    if (placeType === "cafe" || placeType === "default") {
      qs.push(`${t} 실내`, `${t} 창가`, `${t} 좌석`, `${t} 메뉴`);
    }

    const blob = `${spot.real_place_name ?? ""} ${spot.title ?? ""}`;
    if (/광화문광장|세종대왕|이순신|광화문/.test(blob)) {
      if (/세종|세종대왕/.test(blob)) qs.push(`${t} 세종대왕 동상`);
      if (/이순신/.test(blob)) qs.push(`${t} 이순신장군 동상`);
      if (/경복|궁/.test(blob)) qs.push(`경복궁 광화문 정문`);
    }

    return { queries: uniqShort(qs).slice(0, 14), mode: "entity" };
  }

  const broad = buildSpotImageQuery(spot, opts);
  return { queries: broad.trim() ? [broad.trim()] : [], mode: "broad_fallback" };
}

/** 진단용: 현재 모드에서 대표로 보여줄 검색어 한 줄 */
export function primaryImageQueryLabel(spot: RouteSpot, primary: NaverPrimaryPlace | null, opts?: BuildSpotImageQueryOpts): string {
  const { queries } = buildRefinedImageQueries(spot, primary, opts);
  return queries[0] ?? "";
}
