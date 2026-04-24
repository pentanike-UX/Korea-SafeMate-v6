/**
 * 탭 간 auth / mock 가디언 쿠키 전환 알림 (BroadcastChannel).
 * 쿠키는 탭 간 공유되지만 JS 상태는 자동 갱신되지 않아, 다른 탭에서 로그인·로그아웃 시 이 채널로 동기화한다.
 *
 * 브로드캐스트 호출 위치:
 * - `login-as-mock-guardian` — mock 로그인 API 성공 직후
 * - `google-sign-in-button` — mock 쿠키 제거 직후
 * - `header-account-menu` — 로그아웃( mock 해제 + Supabase signOut ) 직후
 *
 * `/api/dev/mock-guardian-login`을 `loginAsMockGuardian` 밖에서 직접 호출하면 이 함수도 호출해야
 * 다른 탭의 포인트 캐시·`useAuthUser` 상태가 맞는다.
 */
const CHANNEL_NAME = "safemate-auth-v1";

export type ClientAuthTabMessage = { v: 1; kind: "context-changed" };

export function broadcastClientAuthContextChanged(): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.postMessage({ v: 1, kind: "context-changed" } satisfies ClientAuthTabMessage);
    ch.close();
  } catch {
    /* ignore */
  }
}

export function subscribeClientAuthContextChanged(handler: () => void): () => void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return () => {};
  }
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    const onMessage = (ev: MessageEvent<ClientAuthTabMessage>) => {
      if (ev.data?.v === 1 && ev.data?.kind === "context-changed") handler();
    };
    ch.addEventListener("message", onMessage);
    return () => {
      ch.removeEventListener("message", onMessage);
      ch.close();
    };
  } catch {
    return () => {};
  }
}
