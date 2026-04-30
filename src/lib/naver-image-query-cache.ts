/**
 * 네이버 이미지 검색 결과 — query 기준 24h 로컬 캐시 (개발·운영 전환 전단계)
 * key: naver:image:{base64url(query)} 또는 짧은 해시
 */

const PREFIX = "naver:image:";
const TTL_MS = 24 * 60 * 60 * 1000;

function hashQuery(q: string): string {
  let h = 0;
  for (let i = 0; i < q.length; i++) h = (Math.imul(31, h) + q.charCodeAt(i)) | 0;
  return `h${Math.abs(h).toString(36)}`;
}

export function naverImageQueryCacheKey(query: string): string {
  return `${PREFIX}${hashQuery(query.trim())}`;
}

export type NaverImageCachePayload = {
  query: string;
  items: unknown[];
  fetchedAt: number;
};

export function readNaverImageQueryCache(query: string): NaverImageCachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(naverImageQueryCacheKey(query));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NaverImageCachePayload;
    if (!parsed?.fetchedAt || !Array.isArray(parsed.items)) return null;
    if (Date.now() - parsed.fetchedAt > TTL_MS) {
      localStorage.removeItem(naverImageQueryCacheKey(query));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeNaverImageQueryCache(query: string, items: unknown[]): void {
  try {
    const payload: NaverImageCachePayload = {
      query: query.trim(),
      items,
      fetchedAt: Date.now(),
    };
    localStorage.setItem(naverImageQueryCacheKey(query), JSON.stringify(payload));
  } catch {
    /* quota */
  }
}
