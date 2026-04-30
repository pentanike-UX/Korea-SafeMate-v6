/** Domain types — align with `supabase/schema.sql`. */

/** Platform-facing role. Users may effectively wear multiple hats in production; this is the primary label. */
export type UserRole =
  | "traveler"
  | "contributor"
  | "active_guardian"
  | "verified_guardian"
  | "admin";

/** Guardian program tier — open participation ≠ trusted matching. */
export type GuardianTier = "contributor" | "active_guardian" | "verified_guardian";

export type BookingStatus =
  | "requested"
  | "reviewing"
  | "matched"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "issue_reported";

/** Legacy verification workflow; kept for admin review before matching unlock. */
export type GuardianApprovalStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "paused"
  | "rejected";

export type ServiceTypeCode = "arrival" | "k_route" | "first_24h";

export type ContentPostStatus = "draft" | "pending" | "approved" | "rejected";

export type ContentPostKind =
  | "hot_place"
  | "local_tip"
  | "food"
  | "shopping"
  | "k_content"
  | "practical";

/**
 * 히어로·카드 크롭 우선순위용 메타 — `kind` 휴리스틱보다 우선(없으면 kind fallback).
 * DB: `content_posts.hero_subject` (nullable).
 */
export type ContentPostHeroSubject = "person" | "place" | "mixed";

export type RegionPhase = 1 | 2;

/** Explore sorting — TODO(prod): backed by DB columns or materialized views. */
export type ExploreSortMode = "latest" | "popular" | "recommended";

export type ContactChannel = "telegram" | "kakao" | "whatsapp" | "line" | "email" | "other";

/** Channels offered on the booking handoff step (subset + email). */
export type BookingHandoffChannel = "kakao" | "telegram" | "whatsapp" | "email";

export type TravelerUserType = "foreign_traveler" | "korean_traveler";

export type BookingInterestId =
  | "k_pop"
  | "k_drama"
  | "k_movie"
  | "food"
  | "shopping"
  | "local_support";

export type BookingSupportNeedId =
  | "transportation"
  | "check_in"
  | "ordering"
  | "local_tips"
  | "route_support"
  | "practical_guidance";

/**
 * Full guest booking request — maps to `bookings.request_payload` + core columns.
 * TODO(prod): Align with authenticated traveler_user_id when logged in.
 */
export interface BookingRequestPayload {
  service_code: ServiceTypeCode;
  traveler_user_type: TravelerUserType;
  region_slug: string;
  requested_date: string;
  requested_time: string;
  /** ISO 8601 combined in Asia/Seoul for DB `requested_start`. */
  requested_start_iso: string;
  traveler_count: number;
  preferred_language: string;
  first_time_in_korea: boolean;
  meeting_point: string;
  accommodation_area: string;
  interests: BookingInterestId[];
  support_needs: BookingSupportNeedId[];
  guest_name: string;
  guest_email: string;
  special_requests: string;
  preferred_contact_channel: BookingHandoffChannel;
  contact_handle: string;
  agreements: {
    scope: boolean;
    admin_review: boolean;
    no_immediate_chat: boolean;
  };
  submitted_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface TravelerProfile {
  user_id: string;
  full_name: string;
  country_code: string;
  phone: string | null;
  preferred_language: string;
}

export interface GuardianLanguage {
  guardian_user_id: string;
  language_code: string;
  proficiency: "basic" | "conversational" | "fluent" | "native";
}

export interface GuardianProfile {
  user_id: string;
  display_name: string;
  headline: string;
  bio: string;
  /** Tier within the guardian program (contribution + trust ladder). */
  guardian_tier: GuardianTier;
  approval_status: GuardianApprovalStatus;
  years_in_seoul: number;
  photo_url: string | null;
  /** Optional overrides — see `guardianProfileImageUrls` fallbacks. */
  avatar_image_url?: string | null;
  list_card_image_url?: string | null;
  detail_hero_image_url?: string | null;
  /** 상세 본문 소개 갤러리 — 공개 페이지·관리자에서 동일 필드 사용 */
  intro_gallery_image_urls?: string[];
  languages: GuardianLanguage[];
  primary_region_slug: string;
  /** Rolling MVP metrics — TODO(prod): compute from `content_posts` + `guardian_activity_logs`. */
  posts_approved_last_30d: number;
  posts_approved_last_7d: number;
  featured: boolean;
  influencer_seed: boolean;
  /** Ops-gated; true only for verified + policy — never auto from post count alone. */
  matching_enabled: boolean;
  /** TODO(prod): Aggregate from `traveler_reviews`. */
  avg_traveler_rating: number | null;
  /** Neighborhood / theme tags for Explore trust UI. */
  expertise_tags: string[];
  /** DB sample row — 공개 UI에서 샘플 배지(실데이터와 동일 렌더). */
  is_sample?: boolean;
}

export interface Region {
  id: string;
  slug: string;
  name: string;
  name_ko: string;
  phase: RegionPhase;
  short_description: string;
  /** Longer copy for region hub pages. */
  detail_blurb: string;
}

export interface ContentCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
}

/** Shape of guardian-authored content — v2 route product uses spot / route / hybrid. */
export type ContentPostFormat = "article" | "spot" | "route" | "hybrid";

export type RouteTransportMode = "walk" | "car" | "mixed";

export type RouteDifficulty = "easy" | "moderate" | "active";

export type RouteRecommendedTimeOfDay = "morning" | "afternoon" | "evening" | "night" | "flexible";

/** WGS84 — swap map provider without changing domain. */
export interface MapLatLng {
  lat: number;
  lng: number;
}

export interface RouteJourneyMetadata {
  transport_mode: RouteTransportMode;
  /** Total leg time in minutes (manual or from routing API later). */
  estimated_total_duration_minutes: number;
  /** km — manual or computed when routing is wired. */
  estimated_total_distance_km: number;
  recommended_time_of_day: RouteRecommendedTimeOfDay;
  difficulty: RouteDifficulty;
  recommended_traveler_types: string[];
  night_friendly: boolean;
}

/** 스팟 갤러리 1칸 — 자동 Naver·로컬 혼합 저장/표시 */
export interface SpotGalleryItem {
  url: string;
  thumbnail?: string;
  title?: string;
  source?: "naver-image" | "local" | "fallback";
  width?: number;
  height?: number;
  score?: number;
}

/**
 * 스팟 이미지 검색·필터 전략 — 랜드마크/궁궐은 음식·상권 이미지 제외.
 * 미지정 시 클라이언트에서 `resolveSpotImagePlaceType()` 휴리스틱.
 */
export type SpotImagePlaceType =
  | "cafe"
  | "landmark"
  | "palace"
  | "plaza"
  | "walking"
  | "nightview"
  | "default";

/** One stop on a guardian-curated route (or the single anchor for a spot post). */
export interface RouteSpot {
  id: string;
  order: number;
  title: string;
  place_name: string;
  /** From place search / geocoder; optional for legacy posts. */
  address_line?: string;
  short_description: string;
  body: string;
  /** Editor uploads (`/...` paths). Empty or legacy `https://` → UI maps `public/mock/posts` by 텍스트. */
  image_urls: string[];
  recommend_reason: string;
  stay_duration_minutes: number;
  photo_tip: string;
  caution: string;
  lat: number;
  lng: number;
  featured?: boolean;
  /** Minutes to travel to the NEXT spot (omit on last spot). */
  next_move_minutes?: number;
  /** Distance to next spot in meters (omit on last spot). */
  next_move_distance_m?: number;
  /** Transport mode to next spot. */
  next_move_mode?: "walk" | "subway" | "bus" | "taxi";
  /** K-content / theme flavour text shown as thematic context in spot detail. */
  theme_reason?: string;
  /** Concise "what to do here" action guide (1–3 sentences). */
  what_to_do?: string;
  /** Image alt text for the representative image. */
  image_alt?: string;
  /**
   * Links this embedded RouteSpot to a `spot_catalog` row.
   * When present, image resolution prefers `spot_images` typed catalog images.
   */
  spot_catalog_id?: string;

  // ── Naver 이미지 연동 필드 (Phase 2 — 에디터/AI가 채움) ──────────────────────
  /**
   * Naver Image Search 쿼리 문자열.
   * 예: "블루보틀 강남점 외관", "광화문광장 세종대왕상"
   * 비어있으면 buildSpotImageQuery()가 자동 생성.
   */
  image_query?: string;

  /**
   * Naver Image Search API 결과 캐시 (AI/에디터가 저장).
   * 실시간 검색 없이 빠르게 후보를 표시하는 용도.
   */
  image_candidates?: NaverImageCandidate[];

  /**
   * 관리자/에디터가 최종 선택한 대표 이미지 URL.
   * 이미지 해상도 최우선 순위.
   */
  selected_image?: string;

  /**
   * 대표 이미지의 출처.
   * "naver" | "admin_upload" | "catalog" | "local" | "placeholder"
   */
  image_source?: "naver" | "admin_upload" | "catalog" | "local" | "placeholder";

  /**
   * 이미지 갤러리 visual identity (쿼리·랭킹). `default`는 일반(카페=실내·메뉴 쿼리 허용).
   * @see SpotImagePlaceType
   */
  image_place_type?: SpotImagePlaceType;

  /** 원본 장소명(검색·Local API 결과와 매칭). 없으면 place_name·title 사용. */
  spot_name?: string;
  /** 카드·캡션용 표시명. 없으면 title → place_name 순. */
  display_name?: string;
  /** 네이버 로컬 카테고리 경로 일부(예: 음식점>카페). */
  category?: string;
  /** 행정구·동 등 짧은 지역 라벨 (쿼리·표시). */
  district?: string;
  /** 지번 등 일반 주소 — 없으면 address_line과 동일 취급 가능. */
  address?: string;
  /** 도로명주소 */
  road_address?: string;
  /** 네이버 플레이스 숫자 ID (링크에서 추출·저장). */
  naver_place_id?: string;
  /** 네이버 지도/플레이스 상세 URL */
  naver_link?: string;

  /**
   * 역할별 이미지 URL (실제 장소 기반·에디터 지정).
   * 해상도: selected_image → gallery → Naver → images.hero → … (see getSpotImageDisplayUrl).
   */
  images?: {
    hero?: string;
    practical?: string;
    walking?: string;
    timing?: string;
    night?: string;
    /** 자동·에디터 갤러리(최대 10) — DB/JSON 저장 시 */
    gallery?: SpotGalleryItem[];
    /** 최종 폴백 단일 URL */
    fallback?: string;
  };

  /** 통합 표기용 실존 장소명 (플레이스명·동상 공식 명칭 등). */
  real_place_name?: string;

  /**
   * 무료 티저용 분위기 제목 — 실제 상호·랜드마크 정확명 금지.
   * 없으면 클라이언트 휴리스틱(`atmospherePlaybookTitle`)으로 보강.
   */
  display_mood_title?: string;
  /** 무료 티저 한 줄 부연 — 현장 실행 정보 금지. */
  display_mood_subtitle?: string;

  /**
   * 목업·검수 상태 — 슈퍼관리자 UI에서만 표시 권장.
   * verified: 명칭·좌표·이미지 후보 확인 | needs_review: 플레이스홀더 | mock: 시드만
   */
  source_status?: "mock" | "verified" | "needs_review";

  /** 직전 스팟에서 이 스팟으로 오는 동안의 메모(도보·펜스·횡단 등). 첫 스팟은 보통 비움. */
  leg_from_previous?: string;

  // Naver Maps 좌표 (spot_catalog 없이 직접 저장할 때)
  // lat / lng 는 이미 존재 (위 필드)
}

// ─── Spot Catalog ─────────────────────────────────────────────────────────────

/** Image roles in the typed spot image system. */
export type SpotImageType = "hero" | "practical" | "walking" | "timing" | "night";

/** A typed image attached to a `spot_catalog` entry. */
export interface SpotImage {
  id: string;
  spot_catalog_id: string;
  url: string;
  image_type: SpotImageType;
  is_primary: boolean;
  sort_order: number;
  /** Image source — Naver scraped, guardian upload, admin upload, or stock. */
  source: "naver" | "guardian_upload" | "admin_upload" | "stock";
  caption_ko?: string | null;
  caption_en?: string | null;
  /** True when image is stored in Supabase Storage (false = still an external URL). */
  is_stored: boolean;
  created_at: string;
}

/** Subset of `spot_catalog` used in lists and linked spot resolution. */
export interface SpotCatalogEntry {
  id: string;
  name_ko: string;
  name_en?: string | null;
  address_ko?: string | null;
  district?: string | null;
  lat: number;
  lng: number;
  category: "food" | "cafe" | "attraction" | "shopping" | "nightlife" | "nature" | "activity";
  subcategory?: string | null;
  region_tags: string[];
  naver_place_id?: string | null;
  kakaomap_id?: string | null;
  image_strategy: "practical" | "aesthetic" | "mixed";
  /** Cached hero+is_primary image URL for fast list rendering. */
  primary_image_url?: string | null;
  is_verified: boolean;
  is_active: boolean;
  source: "manual" | "tour_api" | "naver_api" | "guardian_submitted";
  created_at: string;
}

/** Naver Local Search API result item (raw → parsed). */
export interface NaverPlaceSearchResult {
  /** HTML-encoded place name from Naver — clean with stripHtmlTags(). */
  title: string;
  /** Naver map link — place ID extractable from the URL path. */
  link: string;
  /** Slash-separated category (e.g. "음식점>카페>커피전문점"). */
  category: string;
  address: string;
  roadAddress: string;
  /** Longitude × 10^7 as string. */
  mapx: string;
  /** Latitude × 10^7 as string. */
  mapy: string;
}

/**
 * 로컬 검색 유사도 1순위로 확정한 장소 Entity — 이미지 검색어 정제에 사용.
 */
export interface NaverPrimaryPlace {
  title: string;
  category: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
  link: string;
  /** `getPlaceSimilarityScore` 결과 */
  similarityScore: number;
  source: "naver-local";
  naver_place_id?: string | null;
  lat?: number;
  lng?: number;
}

/** Typed catalog image map — keyed by spot_catalog_id, used for server-side pre-fetch. */
export type CatalogImageMap = Map<string, SpotImage[]>;

/** Naver Image Search API 결과 단건 (클라이언트에 안전하게 전달되는 포맷). */
export interface NaverImageCandidate {
  /** HTML 태그 제거된 이미지 설명. */
  title: string;
  /** 원본 이미지 링크 (외부 사이트). */
  link: string;
  /** 고해상도 표시용 — 보통 `link`와 동일 (정규화 시 설정). */
  url?: string;
  /** 일부 응답의 대체 원본 URL. */
  original?: string;
  imageUrl?: string;
  /** 썸네일 URL (Naver CDN). */
  thumbnail: string;
  /** 픽셀 너비 (문자열). */
  sizewidth: string;
  /** 픽셀 높이 (문자열). */
  sizeheight: string;
  /** 정규화 시 숫자 변환 */
  width?: number;
  height?: number;
  /** 원본 링크 호스트 (표시·필터용, 서버에서 파싱). */
  source_domain?: string;
  /** Route Handler 정규화 시 `"naver-image"`. */
  source?: "naver-image";
  /** 품질 점수 (서버/클라이언트) */
  score?: number;
}

/**
 * 카드·탐색 노출용 구조화 메타 — DB 전용 컬럼 추가 전까지 `route_journey` JSON에 함께 저장된다.
 * AI 추천 초안 승인 후 에디터가 채운다.
 */
export interface StructuredExposureMeta {
  audience_tags: string[];
  duration_tags: string[];
  mobility_tags: string[];
  mood_tags: string[];
  /** 목록·카드용 짧은 요약(한 줄 소개 `summary`와 별개). */
  summary_card: string;
  /** 한 줄 추천 이유. */
  reason_line: string;
  /** “이럴 때 좋아요” 맥락 문구. */
  best_for_context: string;
}

export interface RouteJourney {
  metadata: RouteJourneyMetadata;
  spots: RouteSpot[];
  /** Display path (spot-to-spot or routed polyline). Provider-agnostic. */
  path: MapLatLng[];
  structured_exposure_meta?: StructuredExposureMeta;
}

/** `content_posts.structured_content` JSON — v1. */
export const POST_STRUCTURED_CONTENT_VERSION = 1 as const;

export interface RoutePostStructuredSpotBlockV1 {
  spot_order?: number;
  spot_id?: string;
  headline?: string;
  notes?: string;
}

export interface RoutePostStructuredContentV1 {
  intro: string;
  route_summary: string;
  route_best_for?: string;
  route_notes: string;
  narrative: string;
  closing: string;
  guardian_signature: string;
  spots?: RoutePostStructuredSpotBlockV1[];
}

export interface PracticalTipBlockV1 {
  primary: string;
  secondary?: string;
}

export interface PracticalTipStructuredContentV1 {
  context: string;
  one_line_conclusion: string;
  key_summary?: string;
  tip_blocks: PracticalTipBlockV1[];
  checklist: string[];
  field_tips?: string;
  mistakes_notes?: string;
  final_summary: string;
  guardian_signature: string;
}

export type PostStructuredContentV1 =
  | { version: typeof POST_STRUCTURED_CONTENT_VERSION; template: "route_post"; data: RoutePostStructuredContentV1 }
  | { version: typeof POST_STRUCTURED_CONTENT_VERSION; template: "practical_tip_post"; data: PracticalTipStructuredContentV1 };

export interface ContentPost {
  id: string;
  author_user_id: string;
  author_display_name: string;
  region_slug: string;
  category_slug: string;
  kind: ContentPostKind;
  /** 명시 시 이미지 크롭이 kind 추정보다 이 값을 우선한다. */
  hero_subject?: ContentPostHeroSubject | null;
  title: string;
  body: string;
  /** Short line for cards; TODO(prod): generated or editor field. */
  summary: string;
  status: ContentPostStatus;
  created_at: string;
  tags: string[];
  /** Mock engagement — TODO(prod): votes / views from analytics. */
  usefulness_votes: number;
  /** Post-level helpful score 1–5 from travelers, optional. */
  helpful_rating: number | null;
  popular_score: number;
  recommended_score: number;
  featured: boolean;
  /** Omitted or `article` for legacy text-only posts. */
  post_format?: ContentPostFormat;
  /**
   * List/detail hero when set (로컬 경로 권장). `https://` 는 표시에서 무시되고 `public/mock/posts` 매핑을 씁니다.
   * 루트 포스트는 스팟 `image_urls`도 동일 규칙.
   */
  cover_image_url?: string | null;
  route_journey?: RouteJourney;
  /** Short bullets for traveler “insight” strip on route detail. */
  route_highlights?: string[];
  /**
   * 구조형 본문(JSON). 있으면 상세 UI는 이 값을 최우선으로 렌더링하고, `body`는 폴백·검색·레거시용으로 유지.
   * DB: `content_posts.structured_content` jsonb
   */
  structured_content?: PostStructuredContentV1 | null;
  /** Service intro mock — not real UGC; show subtle “(샘플)” in UI. */
  is_sample?: boolean;
  /** Denormalized flag for filtering (true when `route_journey` is present). */
  has_route?: boolean;
}

export interface ServiceType {
  code: ServiceTypeCode;
  name: string;
  short_description: string;
  duration_hours: number;
  base_price_krw: number;
}

export interface Booking {
  id: string;
  traveler_user_id: string | null;
  guardian_user_id: string | null;
  service_code: ServiceTypeCode;
  status: BookingStatus;
  requested_start: string;
  party_size: number;
  pickup_hint: string | null;
  notes: string | null;
  preferred_contact_channel: ContactChannel | null;
  contact_handle_hint: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  /** Full wizard payload for admin review & ops. */
  request_payload?: BookingRequestPayload | null;
  created_at: string;
  updated_at: string;
}

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  changed_at: string;
  actor_user_id: string | null;
  note: string | null;
}

/** Traveler → Guardian after a session / booking. */
export interface TravelerReview {
  id: string;
  booking_id: string;
  traveler_user_id: string;
  guardian_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  /** Mock / display: English body when `comment` is Korean-first */
  comment_en?: string | null;
  /** Pseudonym on public profile */
  reviewer_display_name?: string;
  time_label_ko?: string;
  time_label_en?: string;
  time_label_ja?: string;
  /** Optional traveler photo (mock paths under /mock/...) */
  image_url?: string | null;
  /** i18n keys under TravelerHub.reviewHelpTag.* */
  help_tag_ids?: string[];
}

/** Guardian → Traveler (mutual trust / behavior quality). */
export interface GuardianReview {
  id: string;
  booking_id: string;
  guardian_user_id: string;
  traveler_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ContactMethod {
  id: string;
  user_id: string;
  channel: ContactChannel;
  handle: string;
  is_preferred: boolean;
  verified: boolean;
}

export interface FeaturedGuardian {
  guardian_user_id: string;
  tagline: string;
  priority: number;
  active: boolean;
}

export interface GuardianActivityLog {
  id: string;
  guardian_user_id: string;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface Incident {
  id: string;
  booking_id: string;
  reported_by_user_id: string;
  summary: string;
  severity: "low" | "medium" | "high";
  created_at: string;
  resolved_at: string | null;
}

export interface AdminNote {
  id: string;
  entity_type: "booking" | "guardian" | "traveler" | "content_post";
  entity_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
}

/** View models for UI (joined mock data). */
export interface BookingWithDetails extends Booking {
  traveler_name: string;
  guardian_name: string | null;
  service_name: string;
}
