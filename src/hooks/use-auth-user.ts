"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { subscribeClientAuthContextChanged } from "@/lib/auth/client-auth-tab-sync";
import { buildMockSupabaseUser, readMockGuardianIdFromDocumentCookie } from "@/lib/dev/mock-guardian-auth";
import { invalidateClientPointsCache } from "@/lib/points/client-points-fetch-cache";
import { emitMypageAttentionUpdated } from "@/lib/mypage-attention-events";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

/** `undefined` = 아직 확인 전, `null` = 비로그인 */
export function useAuthUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const prevUserIdRef = { current: undefined as string | null | undefined };
    const lastMockCookieRef = { current: null as string | null };

    const applySessionUser = (next: User | null) => {
      const nextId = next?.id ?? null;
      const prev = prevUserIdRef.current;
      if (prev !== undefined && nextId === prev) {
        return;
      }
      if (prev !== undefined) {
        if (nextId === null || (prev !== null && nextId !== prev)) {
          invalidateClientPointsCache();
        }
      }
      prevUserIdRef.current = nextId;
      setUser(next);
    };

    const resyncFromBrowserAuth = (opts?: { force?: boolean }) => {
      const mid = readMockGuardianIdFromDocumentCookie()?.trim() || null;
      if (mid) {
        if (!opts?.force && mid === lastMockCookieRef.current) {
          return;
        }
        lastMockCookieRef.current = mid;
        applySessionUser(buildMockSupabaseUser(mid));
        return;
      }
      lastMockCookieRef.current = null;
      const sb = createSupabaseBrowserClient();
      if (!sb) {
        applySessionUser(null);
        return;
      }
      void sb.auth.getSession().then(({ data }) => applySessionUser(data.session?.user ?? null));
    };

    const onOtherTabAuthChange = () => {
      invalidateClientPointsCache();
      emitMypageAttentionUpdated();
      resyncFromBrowserAuth({ force: true });
    };

    resyncFromBrowserAuth();

    const onWindowFocus = () => {
      resyncFromBrowserAuth();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        resyncFromBrowserAuth();
      }
    };
    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const unsubBc = subscribeClientAuthContextChanged(onOtherTabAuthChange);

    const sb = createSupabaseBrowserClient();
    let subscription: { unsubscribe: () => void } | null = null;
    if (sb) {
      const {
        data: { subscription: sub },
      } = sb.auth.onAuthStateChange((_event, session) => {
        const mid = readMockGuardianIdFromDocumentCookie()?.trim() || null;
        if (mid) {
          lastMockCookieRef.current = mid;
          applySessionUser(buildMockSupabaseUser(mid));
          return;
        }
        lastMockCookieRef.current = null;
        applySessionUser(session?.user ?? null);
      });
      subscription = sub;
    }

    return () => {
      unsubBc();
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      subscription?.unsubscribe();
    };
  }, []);

  return user;
}
