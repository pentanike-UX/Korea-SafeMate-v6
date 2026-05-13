"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { subscribeClientAuthContextChanged } from "@/lib/auth/client-auth-tab-sync";
import { buildMockSupabaseUser, readMockGuardianIdFromDocumentCookie } from "@/lib/dev/mock-guardian-auth";
import { invalidateClientPointsCache } from "@/lib/points/client-points-fetch-cache";
import { emitMypageAttentionUpdated } from "@/lib/mypage-attention-events";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

/**
 * `undefined` = 아직 확인 전, `null` = 비로그인
 *
 * 초기값을 `null`로 한다(낙관적): SSR/CSR 첫 페인트에서 즉시 "비로그인" 가정 →
 * site-header가 스켈레톤 대신 실제 로그인 버튼을 바로 렌더한다.
 * 그 후 useEffect 안의 `getSession()` 결과에 따라 OAuth 사용자면 user 객체로 업데이트되어
 * 로그인 버튼이 자연스럽게 아바타로 바뀐다.
 *
 * 기존엔 초기값을 `undefined`로 두고 useEffect 결과를 기다렸는데, HMR 실패/네트워크 격리 환경
 * (사설 IP, 시크릿 창 등)에서 useEffect 자체가 reload 안 되면 영원히 스켈레톤이 표시되는
 * 회복 불가 상태가 발생했음.
 */
export function useAuthUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(null);

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
      let sb;
      try {
        sb = createSupabaseBrowserClient();
      } catch (err) {
        // Supabase client 생성이 실패해도 무한 스켈레톤 방지
        console.warn("[useAuthUser] createSupabaseBrowserClient threw:", err);
        applySessionUser(null);
        return;
      }
      if (!sb) {
        applySessionUser(null);
        return;
      }
      // getSession이 hang 또는 reject되어도 user가 영원히 undefined로 멈추지 않도록
      // (1) catch로 reject 흡수, (2) 3초 timeout fallback
      let resolved = false;
      const fallbackTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn("[useAuthUser] getSession timed out (3s), defaulting to null");
          applySessionUser(null);
        }
      }, 3000);
      sb.auth
        .getSession()
        .then(({ data }) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(fallbackTimer);
          applySessionUser(data.session?.user ?? null);
        })
        .catch((err) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(fallbackTimer);
          console.warn("[useAuthUser] getSession failed:", err);
          applySessionUser(null);
        });
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
