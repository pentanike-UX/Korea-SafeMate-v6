import type { GuardianProfile } from "@/types/domain";
import {
  FILL_IMAGE_AVATAR_COVER,
  FILL_IMAGE_GUARDIAN_DETAIL_HERO,
  FILL_IMAGE_GUARDIAN_LIST_CARD,
} from "@/lib/ui/fill-image";

/** 가로 히어로(상세·포스트 사이드·시트 상단) — `landscape` URL + 중앙 크롭 */
export const GUARDIAN_PROFILE_HERO_COVER_CLASS = FILL_IMAGE_GUARDIAN_DETAIL_HERO;

/** 목록·디렉터리 카드 세로 컷 — `default`/`list_card` URL + 상단(얼굴·상체) */
export const GUARDIAN_LIST_CARD_COVER_CLASS = FILL_IMAGE_GUARDIAN_LIST_CARD;

/** 원형·작은 정사각 프로필 — `avatar` URL + 얼굴 중심 */
export const GUARDIAN_AVATAR_COVER_CLASS = FILL_IMAGE_AVATAR_COVER;

/**
 * @deprecated `GUARDIAN_LIST_CARD_COVER_CLASS`(목록) 또는 `GUARDIAN_AVATAR_COVER_CLASS`(아바타) 사용.
 */
export const GUARDIAN_PROFILE_COVER_POSITION_CLASS = GUARDIAN_LIST_CARD_COVER_CLASS;

export type GuardianImageSource = Pick<GuardianProfile, "user_id" | "photo_url"> & {
  avatar_image_url?: string | null;
  list_card_image_url?: string | null;
  detail_hero_image_url?: string | null;
};

function trimUrl(s: string | null | undefined): string {
  const t = s?.trim();
  return t || "";
}

/**
 * 히어로 전용 URL 후보가 실제로 가로형(와이드) 성격인지 URL만으로 판별합니다.
 * - `_landscape` 포함 → 가로 전용 에셋으로 간주
 * - `profile_XX.jpg` (접미사 없음) → 세로 카드용으로 쓰이는 시드가 많아 히어로 후보에서 제외
 * - `_avatar` → 아바타 전용
 * - `/mock/posts/` → 포스트 컷은 대체로 와이드
 */
export function isLikelyLandscapeImageUrl(url: string): boolean {
  if (!url.trim()) return false;
  if (/landscape/i.test(url)) return true;
  if (/_avatar\.(jpg|jpeg|webp|png)$/i.test(url)) return false;
  if (/\/profile_\d{2}\.(jpg|jpeg|webp|png)$/i.test(url)) return false;
  if (/\/mock\/posts\//i.test(url)) return true;
  return false;
}

/**
 * 시드·프로필 경로에서 01–15 인덱스를 추출합니다. (`mg01` / `profile_03.jpg` 등)
 */
export function parseProfileImageIndex(g: Pick<GuardianProfile, "user_id" | "photo_url">): number | null {
  const mg = g.user_id.match(/^mg(\d{2})$/i);
  if (mg) {
    const n = parseInt(mg[1]!, 10);
    if (n >= 1 && n <= 99) return n;
  }
  const raw = g.photo_url?.trim();
  if (!raw) return null;
  const m =
    raw.match(/profile_(\d{2})_(?:landscape|avatar)\.jpg$/i) ?? raw.match(/profile_(\d{2})\.jpg$/i);
  if (m) {
    const n = parseInt(m[1]!, 10);
    if (n >= 1 && n <= 99) return n;
  }
  return null;
}

export function guardianProfileImageUrlsFromIndex(index: number): {
  default: string;
  landscape: string;
  avatar: string;
} {
  const clamped = Math.min(99, Math.max(1, Math.floor(index)));
  const n = String(clamped).padStart(2, "0");
  return {
    default: `/mock/profiles/profile_${n}.jpg`,
    landscape: `/mock/profiles/profile_${n}_landscape.jpg`,
    avatar: `/mock/profiles/profile_${n}_avatar.jpg`,
  };
}

/** 인덱스 없는 레거시 URL만 있을 때 히어로 폴백(가로 컷) */
const FALLBACK_WIDE_HERO = "/mock/posts/광화문_008.jpg";

function seedUrls(g: Pick<GuardianProfile, "user_id" | "photo_url">): {
  default: string;
  landscape: string;
  avatar: string;
} {
  const idx = parseProfileImageIndex(g);
  if (idx == null) {
    const fb = trimUrl(g.photo_url);
    const heroWide = fb && isLikelyLandscapeImageUrl(fb) ? fb : FALLBACK_WIDE_HERO;
    return { default: fb || FALLBACK_WIDE_HERO, landscape: heroWide, avatar: fb || heroWide };
  }
  return guardianProfileImageUrlsFromIndex(idx);
}

/**
 * 상단 히어로: 반드시 가로형 후보만 사용. 세로형 `profile_XX.jpg` 단독은 히어로에 쓰지 않습니다.
 */
function pickHeroLandscapeUrl(g: GuardianImageSource, seed: ReturnType<typeof seedUrls>): string {
  const detailExplicit = trimUrl(g.detail_hero_image_url);
  if (detailExplicit) return detailExplicit;

  const listExplicit = trimUrl(g.list_card_image_url);
  if (listExplicit && isLikelyLandscapeImageUrl(listExplicit)) return listExplicit;

  const legacyPhoto = trimUrl(g.photo_url);
  if (legacyPhoto && isLikelyLandscapeImageUrl(legacyPhoto)) return legacyPhoto;

  return seed.landscape;
}

/**
 * 공개·목록·상세에서 쓰는 3종 URL.
 * - `default`: 목록 카드(비교형) 주 이미지
 * - `landscape`: 상세 히어로 (가로형 전용)
 * - `avatar`: 원형·작은 프로필
 */
export function guardianProfileImageUrls(g: GuardianImageSource): {
  default: string;
  landscape: string;
  avatar: string;
} {
  const seed = seedUrls(g);
  const listExplicit = trimUrl(g.list_card_image_url);
  const detailExplicit = trimUrl(g.detail_hero_image_url);
  const avatarExplicit = trimUrl(g.avatar_image_url);
  const legacyPhoto = trimUrl(g.photo_url);

  const avatar = avatarExplicit || seed.avatar;

  const listCard =
    listExplicit || detailExplicit || legacyPhoto || seed.default;

  const landscape = pickHeroLandscapeUrl(g, seed);

  return {
    default: listCard,
    landscape,
    avatar,
  };
}
