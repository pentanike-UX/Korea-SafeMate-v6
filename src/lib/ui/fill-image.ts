/**
 * `next/image` + `fill` 용 크롭 규칙 — 유형별 `object-position`을 고정해
 * 같은 용도는 항상 같은 잘림을 쓰고, 얼굴·상체·장소 중심을 보존한다.
 * 부모: `relative overflow-hidden` + 고정 비율 또는 `min-h` 권장.
 */
const FS = "h-full w-full object-cover";

// ---------------------------------------------------------------------------
// 공통
// ---------------------------------------------------------------------------

/** 균형 중앙 — 장소·오버레이 안전 구역 */
export const FILL_IMAGE_COVER_CENTER = `${FS} object-center`;

// ---------------------------------------------------------------------------
// A — 아바타 (정사각형 컨테이너, 얼굴 중심)
// ---------------------------------------------------------------------------

export const FILL_IMAGE_AVATAR_COVER = `${FS} object-[center_22%]`;

// ---------------------------------------------------------------------------
// B — 가디언 목록·홈 카드 세로형 (상단 얼굴/상체)
// ---------------------------------------------------------------------------

export const FILL_IMAGE_GUARDIAN_LIST_CARD = `${FS} object-top`;

// ---------------------------------------------------------------------------
// C — 추천 결과 1순위 메인 (강한 상단 앵커, 얼굴 비중↑)
// ---------------------------------------------------------------------------

export const FILL_IMAGE_EXPLORE_TOP_PICK = `${FS} object-top`;

// ---------------------------------------------------------------------------
// D — 가디언 상세·시트 가로 히어로 (텍스트 오버레이 고려, 중앙)
// ---------------------------------------------------------------------------

export const FILL_IMAGE_GUARDIAN_DETAIL_HERO = `${FS} object-center`;

// ---------------------------------------------------------------------------
// E — 포스트 (아티클 히어로 / 목록 16:10 / 시트)
// ---------------------------------------------------------------------------

/** 인물·K-콘텐츠·푸드 등 피사체 위주 컷 */
export const FILL_IMAGE_POST_HERO_SUBJECT = `${FS} object-[center_28%] sm:object-[center_26%]`;

/** 장소·실용 팁 등 풍경·정보 위주 */
export const FILL_IMAGE_POST_HERO_SCENE = `${FS} object-center`;

/** 히어로 — 인물·장면 혼합(`hero_subject: "mixed"`) */
export const FILL_IMAGE_POST_HERO_MIXED = `${FS} object-[center_30%] sm:object-[center_33%]`;

/** 목록 카드 16:10 — 피사체 위주 */
export const FILL_IMAGE_POST_LIST_SUBJECT = `${FS} object-[center_38%] sm:object-top`;

/** 목록 카드 16:10 — 장면 위주 */
export const FILL_IMAGE_POST_LIST_SCENE = `${FS} object-[center_48%] sm:object-center`;

/** 작은 정사각형 썸네일(탐색·시트 리스트) */
export const FILL_IMAGE_POST_THUMB_SQUARE = `${FS} object-[center_35%]`;

/** 썸네일 — 혼합(`hero_subject: "mixed"`) */
export const FILL_IMAGE_POST_THUMB_MIXED = `${FS} object-[center_40%]`;

// ---------------------------------------------------------------------------
// F — 루트·스팟 (장소 기본, 인물 섞임 시 약간 상단)
// ---------------------------------------------------------------------------

export const FILL_IMAGE_ROUTE_SPOT_SCENE = `${FS} object-center`;

export const FILL_IMAGE_ROUTE_SPOT_SUBJECT = `${FS} object-[center_30%]`;

/** 루트 스팟 — 혼합 */
export const FILL_IMAGE_ROUTE_SPOT_MIXED = `${FS} object-[center_33%]`;

// ---------------------------------------------------------------------------
// 호환 별칭 (기존 import 유지)
// ---------------------------------------------------------------------------

/**
 * @deprecated 포스트 히어로는 `postHeroCoverClass()` 사용. 가디언 가로만 필요하면 `FILL_IMAGE_GUARDIAN_DETAIL_HERO`.
 */
export const FILL_IMAGE_COVER_HERO = FILL_IMAGE_GUARDIAN_DETAIL_HERO;

/** @deprecated `FILL_IMAGE_COVER_HERO`와 동일 */
export const FILL_IMAGE_COVER_ROUTE_HERO = FILL_IMAGE_GUARDIAN_DETAIL_HERO;

/** 목록 카드 16:10 — 혼합(`hero_subject: "mixed"` 또는 kind+hero 없을 때 카드 폴백) */
export const FILL_IMAGE_POST_LIST_MIXED = `${FS} object-[center_40%] sm:object-center`;

/** 여행자 리뷰 첨부(16:10) — UGC; 앵커는 목록 혼합과 동일 */
export const FILL_IMAGE_REVIEW_UGC_WIDE = FILL_IMAGE_POST_LIST_MIXED;

/** 홈·탐색·어바웃 혜택 카드 등 16:10 마케팅 타일 */
export const FILL_IMAGE_MARKETING_REGION_TILE = `${FS} object-[center_42%] sm:object-center`;

/** 가디언 소개 가로 갤러리(4:3) — 편집 미리보기와 동일 앵커 */
export const FILL_IMAGE_GUARDIAN_INTRO_GALLERY_ITEM = FILL_IMAGE_MARKETING_REGION_TILE;

/** 홈 듀얼 CTA — 여행자 초상(인물 비중) */
export const FILL_IMAGE_MARKETING_CTA_TRAVELER = `${FS} object-[center_28%]`;

/** 홈 듀얼 CTA — 가디언 초상 */
export const FILL_IMAGE_MARKETING_CTA_GUARDIAN = `${FS} object-top sm:object-[center_28%]`;

/** 풀블리드 히어로 배경(캐러셀·패럴럭스 등) */
export const FILL_IMAGE_MARKETING_HERO_FULLBLEED = FILL_IMAGE_COVER_CENTER;

/** @deprecated `FILL_IMAGE_POST_LIST_MIXED` 또는 `postListCardCoverClass(post)` */
export const FILL_IMAGE_COVER_CARD_16_10 = FILL_IMAGE_POST_LIST_MIXED;
