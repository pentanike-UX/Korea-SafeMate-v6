"use client";

import { useEffect, useState } from "react";
import type { AppAccountRole } from "@/lib/auth/app-role";
import { useAuthUser } from "@/hooks/use-auth-user";
import { sameOriginApiUrl } from "@/lib/api-origin";

/**
 * `undefined`: 세션 또는 역할 로딩 중 · `null`: 비로그인 · 그 외: `users.app_role`
 */
export function useViewerRole(): AppAccountRole | null | undefined {
  const user = useAuthUser();
  const [appRole, setAppRole] = useState<AppAccountRole | undefined>(undefined);

  useEffect(() => {
    if (user === undefined) {
      setAppRole(undefined);
      return;
    }
    if (user === null) {
      return;
    }
    let cancelled = false;
    setAppRole(undefined);
    void fetch(sameOriginApiUrl("/api/account/me"), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { user?: { app_role?: AppAccountRole } } | null) => {
        if (cancelled) return;
        setAppRole(d?.user?.app_role ?? "traveler");
      })
      .catch(() => {
        if (!cancelled) setAppRole("traveler");
      });
    return () => {
      cancelled = true;
    };
  }, [user, user?.id]);

  if (user === undefined) return undefined;
  if (user === null) return null;
  return appRole;
}
