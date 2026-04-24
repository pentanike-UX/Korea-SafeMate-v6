/**
 * TravelerHub `region.*` 메시지 키와 매칭되는 지역 라벨 식별자.
 * slug/메모에서 추출해 요청 카드·스냅샷 등에서 `t(\`region.${key}\`)`로 표시한다.
 */
export const TRAVELER_HUB_REGION_LABEL_KEYS = [
  "gwanghwamun",
  "gangnam",
  "seoul",
  "busan",
  "jeju",
] as const;

export type TravelerHubRegionLabelKey = (typeof TRAVELER_HUB_REGION_LABEL_KEYS)[number];

/**
 * DB·예약 payload·가디언 `primary_region_slug` 등에서 오는 문자열을 라벨 키로 정규화.
 * 더 구체적인 서울 권역(gwanghwamun/gangnam)을 먼저 매칭한 뒤 도시 단위(busan/jeju/seoul)로 넓힌다.
 */
export function regionKeyFromSlug(slug: string): TravelerHubRegionLabelKey | null {
  const s = slug.toLowerCase();
  if (
    s.includes("gwanghwamun") ||
    s.includes("gyeongbok") ||
    s.includes("jongno") ||
    s.includes("bukchon") ||
    s.includes("광화문") ||
    s.includes("북촌")
  ) {
    return "gwanghwamun";
  }
  if (s.includes("gangnam") || s.includes("강남") || s.includes("nonhyeon") || s.includes("논현")) {
    return "gangnam";
  }
  if (
    s === "busan" ||
    s.includes("busan") ||
    s.includes("부산") ||
    s.includes("haeundae") ||
    s.includes("해운대") ||
    s.includes("nampo") ||
    s.includes("남포") ||
    s.includes("gwangalli") ||
    s.includes("광안리") ||
    s.includes("haeundae-gu") ||
    s.includes("suyeong")
  ) {
    return "busan";
  }
  if (
    s === "jeju" ||
    s.includes("jeju") ||
    s.includes("제주") ||
    s.includes("jeju-do") ||
    s.includes("jejudo") ||
    s.includes("jeju_island")
  ) {
    return "jeju";
  }
  if (s === "seoul" || s.includes("seoul") || s.includes("서울")) {
    return "seoul";
  }
  return null;
}
