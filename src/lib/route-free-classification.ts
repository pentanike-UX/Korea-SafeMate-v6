import type { RouteSpot } from "@/types/domain";

/** 무료 접힘 카드 — 분위기·역할 4분류 (제목·칩·프리뷰 라인에 공통 사용) */
export type FreeArchetype = "prep" | "photo" | "rest" | "destination";

function spotText(spot: RouteSpot): string {
  return [spot.title, spot.place_name, spot.theme_reason, spot.what_to_do, spot.short_description]
    .filter(Boolean)
    .join(" ");
}

/** 궁·한양 권역 등 궁궐 맥락 — 제목 문구 톤만 조정 */
export function isPalaceRouteContext(spot: RouteSpot): boolean {
  return /궁|경복|창덕|덕수|창경|궁궐|수원화성|조선왕릉/.test(spotText(spot));
}

/**
 * 문구 키워드: 포토 힌트 → 준비 → 휴식 → 목적지
 */
export function inferFreeArchetype(spot: RouteSpot): FreeArchetype {
  const t = spotText(spot);
  if (/포토|야경|전망|촬영|인생샷|뷰포인트|대표\s*포토|각도|인생\s*샷/.test(t)) return "photo";
  if (/준비|체크|방향|화장실|행사|입장\s*전|광장|집결|동선\s*잡|편의/.test(t)) return "prep";
  if (/휴식|그늘|물\b|카페|커피|베이커리|디저트|쉬어|앉아/.test(t)) return "rest";
  return "destination";
}

/** 무료 접힘 제목 — 분류형 장소명 (실명·상호 없음) */
export function freeClassificationTitle(spot: RouteSpot): string {
  const arch = inferFreeArchetype(spot);
  const palace = isPalaceRouteContext(spot);
  if (palace) {
    switch (arch) {
      case "prep":
        return "궁 입장 전 광장 체크 구간";
      case "photo":
        return "광장 대표 포토 포인트";
      case "rest":
        return "그늘과 화장실을 정리하는 휴식 구간";
      case "destination":
        return "궁궐 정문 진입 구간";
    }
  }
  switch (arch) {
    case "prep":
      return "입장·동선 전 체크 구간";
    case "photo":
      return "대표 포토 포인트";
    case "rest":
      return "그늘과 화장실을 정리하는 휴식 구간";
    case "destination":
      return "목적지·입장 동선 구간";
  }
}
