/**
 * HaruTimeline 전용 타입 — v6 시그니처 컴포넌트
 * DB: routes + route_spots + spot_catalog JOIN 결과
 * Foundation §4.3, IA T10
 */

export type MoveMethod = "walk" | "subway" | "taxi";
export type AppLocale = "ko" | "en" | "th" | "vi";

/** i18n 텍스트 맵 — 언어별 nullable */
export type LocaleMap = Partial<Record<AppLocale, string | null>>;

/**
 * 스팟에 연결된 아티스트(아이돌/그룹/창작자) 메타.
 * K-뮤직 테마 등 콘텐츠 컨텍스트가 있는 스팟에 부착해 카드/드로어에서 노출.
 */
export interface SpotArtist {
  /** 안정 키 (avatar fallback 색 hashing 등에 사용) */
  id: string;
  /** 표시 이름 (한국어 기본) */
  name: string;
  name_en?: string;
  /** 원형 아바타 이미지 URL — 없으면 initials로 대체 */
  avatar_url?: string | null;
  /** 아바타 fallback 텍스트 (1~3자 권장) */
  initials: string;
  /** 아바타 fallback 배경 (tailwind class 또는 hex) */
  accent_class?: string;
  /** 소속사 / 레이블 */
  agency?: string;
  /** 대표곡·작품 (3개 이내 권장) */
  rep_works?: string[];
  /** 이 스팟과 연결된 무대·작품 한 줄 (e.g. "〈IDOL〉 — BTS Week, 더 투나잇 쇼") */
  scene?: string;
}

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

  /** 연결 아티스트 (K-MUSIC 등 콘텐츠 테마). 카드 하단·드로어에 노출. */
  artists?: SpotArtist[];

  /**
   * 스팟 상세 콘텐츠 — 시트로 펼쳐서 보여주는 풍부 정보.
   * 하루웨이(post)의 "하루 흐름" 섹션과 동일한 콘텐츠를 하루루트에서도 재사용한다.
   * 인수 후 데이터 모델 통합 시 spot_catalog의 정식 컬럼으로 승격 예정.
   */
  details?: {
    /** 갤러리 이미지 URL (최대 9장 권장) */
    gallery_image_urls?: string[];
    /** "왜 여기냐면" — 가디언의 추천 이유 */
    why_here?: LocaleMap;
    /** "여기서 할 것" — 액션 가이드 */
    what_to_do?: LocaleMap;
    /** "포토 팁" */
    photo_tip?: LocaleMap;
    /** "주의" — 시기·날씨·통제 등 */
    caution?: LocaleMap;
  };
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
