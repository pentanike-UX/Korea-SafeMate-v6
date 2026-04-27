/**
 * HaruTimeline 전용 타입 — v6 시그니처 컴포넌트
 * DB: routes + route_spots + spot_catalog JOIN 결과
 * Foundation §4.3, IA T10
 */

export type MoveMethod = "walk" | "subway" | "taxi";
export type AppLocale = "ko" | "en" | "th" | "vi";

/** i18n 텍스트 맵 — 언어별 nullable */
export type LocaleMap = Partial<Record<AppLocale, string | null>>;

/** route_spots + spot_catalog JOIN */
export interface HaruSpot {
  id: string;
  /** sort_order (1-based) */
  order: number;

  /** spot_catalog 기본 정보 */
  catalog: {
    name: LocaleMap;
    category: string;            // "cafe" | "restaurant" | "park" | "shopping" | ...
    category_emoji: string;      // 빠른 시각 인식용
    image_url?: string | null;
    address?: string | null;
    lat: number;
    lng: number;
  };

  /** 스팟에서 머무는 시간 (분) */
  stay_min: number;

  /** 가디언이 이 스팟에 대해 쓴 짧은 메모 */
  guardian_note: LocaleMap;

  /** 이전 스팟 → 이 스팟 이동 수단/시간 (첫 스팟은 null) */
  move_from_prev_method?: MoveMethod | null;
  move_from_prev_min?: number | null;

  /** 강조 스팟 */
  featured?: boolean;
}

/** routes 테이블 + guardian 정보 */
export interface HaruRoute {
  id: string;
  title: LocaleMap;
  guardian: {
    display_name: string;
    photo_url?: string | null;
  };
  total_duration_min: number;
  estimated_cost_min_krw?: number | null;
  estimated_cost_max_krw?: number | null;
  spots: HaruSpot[];
  /** 추천 시간대 */
  recommended_time_of_day?: "morning" | "afternoon" | "evening" | "flexible" | null;
  cover_image_url?: string | null;
}
