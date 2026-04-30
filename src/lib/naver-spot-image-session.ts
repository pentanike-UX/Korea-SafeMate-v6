/**
 * Naver 이미지 검색 결과 — 탭 단위 캐시(세션).
 * 상세·목록·슈퍼관리자 후보 UI가 동일 키를 쓰면 중복 API 호출을 줄인다.
 */

import type { NaverImageCandidate } from "@/types/domain";

function hashQuery(q: string): string {
  let h = 0;
  for (let i = 0; i < q.length; i++) h = (Math.imul(31, h) + q.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

export function naverImageSessionKey(spotId: string, query: string): string {
  return `haru:naver-img:v1:${spotId}:${hashQuery(query.trim())}`;
}

export function readNaverImageSession(spotId: string, query: string): NaverImageCandidate[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(naverImageSessionKey(spotId, query));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { items?: NaverImageCandidate[] };
    const items = parsed.items;
    return Array.isArray(items) && items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

export function writeNaverImageSession(spotId: string, query: string, items: NaverImageCandidate[]): void {
  try {
    sessionStorage.setItem(
      naverImageSessionKey(spotId, query),
      JSON.stringify({ items, ts: Date.now() }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearNaverImageSession(spotId: string, query: string): void {
  try {
    sessionStorage.removeItem(naverImageSessionKey(spotId, query));
  } catch {
    /* ignore */
  }
}
