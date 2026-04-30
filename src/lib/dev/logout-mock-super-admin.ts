import { broadcastClientAuthContextChanged } from "@/lib/auth/client-auth-tab-sync";
import { setMockSuperAdminLocalMirror } from "@/lib/dev/mock-super-admin-client";

export async function logoutMockSuperAdmin(): Promise<{ ok: boolean }> {
  const res = await fetch("/api/dev/mock-super-admin-logout", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    return { ok: false };
  }
  setMockSuperAdminLocalMirror(false);
  broadcastClientAuthContextChanged();
  return { ok: true };
}
