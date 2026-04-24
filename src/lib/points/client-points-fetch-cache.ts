import type { MypagePointsApiResponse } from "@/lib/points/types";

export const CLIENT_POINTS_CACHE_TTL_MS = 35_000;

let clientPointsFetchCache: { userId: string; at: number; data: MypagePointsApiResponse } | null = null;

/**
 * 클라이언트 메모리의 `/api/traveler/points` 응답 캐시를 비웁니다.
 *
 * 호출 위치:
 * - `header-account-menu` — 로그아웃 직전(세션 제거 전에 stale 방지)
 * - `use-auth-user` — Supabase 세션 user id 변경·로그아웃 시
 * - `login-as-mock-guardian` — mock 로그인 API 성공 직후(포커스 없이 쿠키만 바뀌는 경우 대비)
 * - `google-sign-in-button` — OAuth 직전 mock 쿠키 제거 직후
 * - `client-auth-tab-sync` — 다른 탭에서 `broadcastClientAuthContextChanged` 수신 시 (`use-auth-user`)
 *
 * mock 가디언 쿠키 전환은 `use-auth-user`의 포커스/가시성·BroadcastChannel 재동기화로 보강한다.
 */
export function invalidateClientPointsCache(): void {
  clientPointsFetchCache = null;
}

export function clearClientPointsCacheIfUserMismatch(userId: string | null): void {
  if (!clientPointsFetchCache) return;
  if (!userId || clientPointsFetchCache.userId !== userId) {
    clientPointsFetchCache = null;
  }
}

export function getClientPointsFetchCache(userId: string): MypagePointsApiResponse | null {
  if (
    clientPointsFetchCache &&
    clientPointsFetchCache.userId === userId &&
    Date.now() - clientPointsFetchCache.at < CLIENT_POINTS_CACHE_TTL_MS
  ) {
    return clientPointsFetchCache.data;
  }
  return null;
}

export function setClientPointsFetchCache(userId: string, data: MypagePointsApiResponse): void {
  clientPointsFetchCache = { userId, at: Date.now(), data };
}
