/**
 * 네이버 Local로 확정한 primaryPlace — 24h 로컬 캐시
 */
import type { NaverPrimaryPlace } from "@/types/domain";

const PREFIX = "naver:place:";
const TTL_MS = 24 * 60 * 60 * 1000;

function hashKey(parts: string[]): string {
  const s = parts.join("|").trim();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `h${Math.abs(h).toString(36)}`;
}

export function naverPlaceResolveCacheKey(spotId: string, searchQuery: string): string {
  return `${PREFIX}${hashKey([spotId, searchQuery])}`;
}

export type NaverPlaceResolvePayload = {
  primaryPlace: NaverPrimaryPlace | null;
  searchQueryUsed: string;
  fetchedAt: number;
};

export function readNaverPlaceResolveCache(spotId: string, searchQuery: string): NaverPlaceResolvePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(naverPlaceResolveCacheKey(spotId, searchQuery));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NaverPlaceResolvePayload;
    if (!parsed?.fetchedAt) return null;
    if (Date.now() - parsed.fetchedAt > TTL_MS) {
      localStorage.removeItem(naverPlaceResolveCacheKey(spotId, searchQuery));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeNaverPlaceResolveCache(
  spotId: string,
  searchQuery: string,
  payload: Omit<NaverPlaceResolvePayload, "fetchedAt">,
): void {
  try {
    const full: NaverPlaceResolvePayload = {
      ...payload,
      fetchedAt: Date.now(),
    };
    localStorage.setItem(naverPlaceResolveCacheKey(spotId, searchQuery), JSON.stringify(full));
  } catch {
    /* quota */
  }
}
