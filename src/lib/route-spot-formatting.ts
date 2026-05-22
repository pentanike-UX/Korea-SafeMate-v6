/**
 * RouteSpot 표시용 공용 유틸 — 거리 포맷·이동 모드 이모지.
 *
 * 동일 함수가 `guardian-route-post-editor`, `route-post-detail-client`,
 * `route-day-preview`에 중복 정의돼 있던 것을 한 곳으로 모음.
 */

export type NextMoveMode = "walk" | "subway" | "bus" | "taxi" | undefined | null;

/** 350m / 1.2km — 1km 미만은 정수 m, 이상은 소숫점 1자리 km. */
export function fmtSpotDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

/**
 * 이동 모드 이모지. `leg-connector.tsx` 컨벤션과 동일:
 * walk=🚶, subway=🚇, bus=🚌, taxi=🚕.
 */
export function nextMoveEmoji(mode: NextMoveMode): string {
  switch (mode) {
    case "subway":
      return "🚇";
    case "bus":
      return "🚌";
    case "taxi":
      return "🚕";
    case "walk":
    default:
      return "🚶";
  }
}
