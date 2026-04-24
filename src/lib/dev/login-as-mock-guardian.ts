import { broadcastClientAuthContextChanged } from "@/lib/auth/client-auth-tab-sync";
import { getGuardianSeedRow, isMockGuardianId } from "@/lib/dev/mock-guardian-auth";
import { invalidateClientPointsCache } from "@/lib/points/client-points-fetch-cache";

/**
 * Dev/demo 전용 — Google 로그인과 분리된 경로로 시드 가디언 쿠키를 설정합니다.
 */
export async function loginAsMockGuardian(guardianId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isMockGuardianId(guardianId) || !getGuardianSeedRow(guardianId)) {
    return { ok: false, error: "invalid_guardian" };
  }
  const res = await fetch("/api/dev/mock-guardian-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ guardianId }),
  });
  if (!res.ok) {
    return { ok: false, error: "request_failed" };
  }
  invalidateClientPointsCache();
  broadcastClientAuthContextChanged();
  return { ok: true };
}
