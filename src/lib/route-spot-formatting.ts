/**
 * RouteSpot 표시용 공용 유틸 — 거리 포맷·이동 모드 이모지.
 *
 * 동일 함수가 `guardian-route-post-editor`, `route-post-detail-client`,
 * `route-day-preview`에 중복 정의돼 있던 것을 한 곳으로 모음.
 */

export type NextMoveMode = "walk" | "subway" | "bus" | "taxi" | undefined | null;

/** HaruSpot 측 `MoveMethod`(walk|subway|taxi)와 호환되는 메타. */
export interface MoveMethodMeta {
  icon: string;
  /** 영문 키워드 (i18n 키 변환·로깅용) */
  label: "walk" | "subway" | "bus" | "taxi";
  labelKo: string;
}

const MOVE_META: Record<"walk" | "subway" | "bus" | "taxi", MoveMethodMeta> = {
  walk: { icon: "🚶", label: "walk", labelKo: "도보" },
  subway: { icon: "🚇", label: "subway", labelKo: "지하철" },
  bus: { icon: "🚌", label: "bus", labelKo: "버스" },
  taxi: { icon: "🚕", label: "taxi", labelKo: "택시" },
};

/** HaruSpot/RouteSpot 양쪽의 이동 모드에서 아이콘·라벨 메타를 얻는다. */
export function moveMethodMeta(mode: NextMoveMode | "walk" | "subway" | "taxi"): MoveMethodMeta {
  if (mode === "subway" || mode === "bus" || mode === "taxi" || mode === "walk") {
    return MOVE_META[mode];
  }
  return MOVE_META.walk;
}

/** 350m / 1.2km — 1km 미만은 정수 m, 이상은 소숫점 1자리 km. */
export function fmtSpotDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

/**
 * 이동 모드 이모지. `MOVE_META`에서 가져온 단일 소스.
 * walk=🚶, subway=🚇, bus=🚌, taxi=🚕.
 */
export function nextMoveEmoji(mode: NextMoveMode): string {
  return moveMethodMeta(mode).icon;
}
