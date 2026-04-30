import { broadcastClientAuthContextChanged } from "@/lib/auth/client-auth-tab-sync";

/**
 * Dev/demo 전용 — 슈퍼관리자 모의 세션을 설정합니다.
 * 결제 없이 하루웨이 상세 전체를 열람할 수 있습니다.
 */
export async function loginAsMockSuperAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/dev/mock-super-admin-login", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    return { ok: false, error: "request_failed" };
  }
  broadcastClientAuthContextChanged();
  return { ok: true };
}
