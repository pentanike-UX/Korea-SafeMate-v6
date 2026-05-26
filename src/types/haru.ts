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
 * 아티스트 라이브러리 내 트랙(앨범) 항목.
 * 커버 이미지는 외부 의존 없이 그라데이션 + 타이틀 fallback으로 렌더 가능하도록
 * cover_url을 옵셔널로 둠. 클릭 시 youtube_url을 새 창으로 연다.
 */
export interface SpotTrack {
  id: string;
  /** 곡 제목 (표시용, 보통 영문/원곡명) */
  title: string;
  /** 한글 부제 — "〈범 내려온다〉" 같은 보조 표기 */
  title_ko?: string;
  /** 앨범/싱글 자켓 이미지 URL — 없으면 아티스트 accent_class 그라데이션으로 대체 */
  cover_url?: string | null;
  /** 발매 연도 (옵션) */
  year?: number;
  /** 공식 MV/오디오 YouTube URL — 새 창으로 연다 */
  youtube_url: string;
}

/**
 * 아티스트 라이브러리 내 영상 항목 (MV·무대·인터뷰·뮤직비디오).
 * 썸네일은 YouTube `i.ytimg.com/vi/<id>/hqdefault.jpg` 등 안정 CDN 사용.
 */
export interface SpotVideo {
  id: string;
  title: string;
  /** 16:9 썸네일 URL — YouTube CDN(i.ytimg.com) 권장 */
  thumbnail_url: string;
  youtube_url: string;
  kind?: "mv" | "stage" | "interview" | "vlog";
}

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
  /** 소속사 / 레이블 (텍스트) */
  agency?: string;
  /** 소속사 홈페이지 URL */
  agency_url?: string;
  /** 아티스트 공식 사이트 URL */
  official_site_url?: string;
  /** 아티스트 공식 YouTube 채널 URL */
  youtube_channel_url?: string;
  /** 인스타그램 공식 계정 URL */
  instagram_url?: string;
  /** 대표곡·작품 (3개 이내 권장) */
  rep_works?: string[];
  /** 이 스팟과 연결된 무대·작품 한 줄 (e.g. "〈IDOL〉 — BTS Week, 더 투나잇 쇼") */
  scene?: string;
  /** 트랙 라이브러리 — 시트 안 가로 스크롤 커버 카드 */
  tracks?: SpotTrack[];
  /** 영상 라이브러리 — 시트 안 16:9 카드 (MV·무대·인터뷰) */
  featured_videos?: SpotVideo[];
}

/**
 * 스팟의 "사운드트랙" — 시트 상단에 크게 노출되는 메인 곡.
 * "이 장소 = 이 곡 하나"로 큐레이션된 진입점. 미선택 시 본문 아티스트 섹션부터 보임.
 */
export interface SpotSoundtrack {
  /** 시트 상단 영웅 카드의 곡 (해당 스팟 아티스트 트랙 중 하나) */
  artist_id: string;
  track_id: string;
  /** 큐레이션 한 줄 — "왜 이 장소에 이 곡인지" */
  curator_note?: LocaleMap;
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

  /** 하루이가 이 스팟에 대해 쓴 짧은 메모 */
  guardian_note: LocaleMap;

  /** 이전 스팟 → 이 스팟 이동 수단/시간 (첫 스팟은 null) */
  move_from_prev_method?: MoveMethod | null;
  move_from_prev_min?: number | null;

  /** 강조 스팟 */
  featured?: boolean;

  /** 연결 아티스트 (K-MUSIC 등 콘텐츠 테마). 카드 하단·드로어에 노출. */
  artists?: SpotArtist[];

  /**
   * 이 스팟의 메인 사운드트랙 — 시트 상단에 영웅 카드로 크게 노출.
   * artist_id + track_id로 위 artists[].tracks[]를 참조.
   */
  soundtrack?: SpotSoundtrack;

  /**
   * 스팟 역할(scene/photo/buy/rest/...) — 복수 가능.
   * `buy`/`experience`는 결제 가능 스팟임을 시각적으로 강조.
   * (domain.ts의 HaruRouteSpotType과 동일 enum, 순환 의존 회피용 로컬 재선언)
   */
  spot_types?: Array<
    | "scene"
    | "story"
    | "buy"
    | "rest"
    | "photo"
    | "local"
    | "experience"
    | "transport"
    | "start"
    | "end"
  >;

  /**
   * 결제 가능 스팟 정보 — 존재하면 시트에서 commerce 패널 노출.
   * 실제 PG 연동은 추후 phase. 본 단계는 mock.
   */
  commerce?: import("@/types/domain").HaruRouteSpotCommerce;

  /**
   * 스팟 상세 콘텐츠 — 시트로 펼쳐서 보여주는 풍부 정보.
   * 하루웨이(post)의 "하루 흐름" 섹션과 동일한 콘텐츠를 하루루트에서도 재사용한다.
   * 인수 후 데이터 모델 통합 시 spot_catalog의 정식 컬럼으로 승격 예정.
   */
  details?: {
    /** 갤러리 이미지 URL (최대 9장 권장) */
    gallery_image_urls?: string[];
    /** "왜 여기냐면" — 하루이의 추천 이유 */
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
    /** ISO timestamp 또는 `mock:online` 센티넬. 온라인 상태 판정용. */
    last_seen_at?: string | null;
  };
  total_duration_min: number;
  estimated_cost_min_krw?: number | null;
  estimated_cost_max_krw?: number | null;
  spots: HaruSpot[];
  /** 추천 시간대 */
  recommended_time_of_day?: "morning" | "afternoon" | "evening" | "flexible" | null;
  cover_image_url?: string | null;
}
