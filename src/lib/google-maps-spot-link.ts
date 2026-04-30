import type { RouteSpot } from "@/types/domain";

/** Maps 링크 빌드 결과 — 슈퍼관리자 검수용 */
export type GoogleMapsSpotLinkKind = "place_id" | "coordinates" | "text_search" | "none";

export function normalizeGooglePlaceIdForMaps(raw?: string | null): string | null {
  const s = raw?.trim();
  if (!s) return null;
  return s.replace(/^places\//, "");
}

/**
 * 우선순위: placeId → lat/lng → realPlaceName+주소 검색.
 */
export function buildGoogleMapsSpotUrl(spot: RouteSpot): { href: string | null; kind: GoogleMapsSpotLinkKind } {
  const pid = normalizeGooglePlaceIdForMaps(spot.google?.placeId);
  if (pid) {
    return {
      href: `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(pid)}`,
      kind: "place_id",
    };
  }

  const { lat, lng } = spot;
  if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
    return {
      href: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      kind: "coordinates",
    };
  }

  const name =
    spot.real_place_name?.trim() ||
    spot.spot_name?.trim() ||
    spot.place_name?.trim() ||
    spot.display_name?.trim() ||
    "";
  const addrParts = [spot.address_line, spot.road_address, spot.address].map((x) => x?.trim()).filter(Boolean);
  const addr = addrParts.join(" ");
  const q = [name, addr].filter(Boolean).join(" ").trim();

  if (q.length > 0) {
    return {
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
      kind: "text_search",
    };
  }

  return { href: null, kind: "none" };
}
