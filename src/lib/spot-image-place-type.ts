import type { RouteSpot, SpotImagePlaceType } from "@/types/domain";

function blob(spot: RouteSpot): string {
  return [
    spot.real_place_name,
    spot.spot_name,
    spot.display_name,
    spot.place_name,
    spot.title,
    spot.category,
    spot.short_description,
    spot.theme_reason,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * 에디터 `image_place_type` 우선, 없으면 장소명·카테고리로 추정.
 */
export function resolveSpotImagePlaceType(spot: RouteSpot): SpotImagePlaceType {
  if (spot.image_place_type) return spot.image_place_type;

  const b = blob(spot);
  const cat = spot.category?.trim() ?? "";

  if (/카페|커피|디저트|베이커리|음식점/.test(cat) || /블루보틀|스타벅스|카페\b/.test(b)) {
    return "cafe";
  }

  if (/야경|야간\b|스카이|루프탑\s*바/.test(b)) return "nightview";

  if (/경복궁|창덕궁|덕수궁|창경궁|경복|창덕|덕수|창경|궁궐|근정전|사직로\s*161/.test(b)) {
    return "palace";
  }

  if (/광화문광장/.test(b)) return "plaza";

  if (/동상|기념물|장군상|대왕상/.test(b)) return "landmark";

  if (/보행로|산책로|둘레길|담장길/.test(b) || /보행로/.test(cat)) return "walking";

  if (/광장|광화문(?!궁)/.test(b) && /문화재|광장/.test(cat)) return "plaza";

  return "default";
}

export function isHeritageVisualStrategy(t: SpotImagePlaceType): boolean {
  return t === "palace" || t === "landmark" || t === "plaza";
}
