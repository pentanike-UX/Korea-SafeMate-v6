/**
 * 슈퍼관리자 이미지 대표 선택 임시 저장 — 브라우저 localStorage.
 *
 * Supabase 확장: 동일 spotId로 `content_posts.route_journey` JSON 내
 * `spots[].selected_image` / `image_source` PATCH 로 이전하면 됨.
 */

const LS_PREFIX = "haruway:spot:";
const LS_SUFFIX = ":selectedImage";

export function spotSelectedImageStorageKey(spotId: string): string {
  return `${LS_PREFIX}${spotId}${LS_SUFFIX}`;
}

export function readLocalSelectedImage(spotId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(spotSelectedImageStorageKey(spotId));
  } catch {
    return null;
  }
}

export function writeLocalSelectedImage(spotId: string, url: string): void {
  try {
    localStorage.setItem(spotSelectedImageStorageKey(spotId), url);
  } catch {
    /* ignore */
  }
}

export function clearLocalSelectedImage(spotId: string): void {
  try {
    localStorage.removeItem(spotSelectedImageStorageKey(spotId));
  } catch {
    /* ignore */
  }
}
