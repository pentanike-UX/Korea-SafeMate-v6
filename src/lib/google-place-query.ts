import type { ContentPost, RouteSpot } from "@/types/domain";

/**
 * Google Text Search용 쿼리 — `real_place_name` + `district` + 지역(가능 시).
 * spot.google.placeId가 있으면 검색 대신 Details만 쓰므로 이 문자열은 무시될 수 있음.
 */
export function buildGoogleTextSearchQuery(spot: RouteSpot, _post: ContentPost): string {
  const name =
    spot.real_place_name?.trim() ||
    spot.spot_name?.trim() ||
    spot.place_name?.trim() ||
    spot.display_name?.trim() ||
    spot.title?.trim() ||
    "";
  const district = spot.district?.trim();
  const parts = [name, district].filter((x) => x && x.length > 0) as string[];
  return parts.join(" ").trim();
}
