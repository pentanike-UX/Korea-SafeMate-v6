"use client";

/**
 * 로그인된 사용자에게 (한 번만) Web Push 구독 시도.
 * - 권한이 default 일 때만 시도. 거부되면 다시 시도하지 않음.
 * - 사용자 첫 인터랙션 이후 시도 (브라우저 정책 호환).
 */

import { useEffect, useRef } from "react";
import { ensurePushSubscribed } from "@/lib/push-client";
import { sameOriginApiUrl } from "@/lib/api-origin";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function PushSubscriptionAutoSubscribe() {
  const triedRef = useRef(false);

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return;
    if (triedRef.current) return;
    if (typeof Notification === "undefined") return;
    // 즉시 요청하지 않고 사용자가 무언가 클릭하면 시도(권한 UX)
    const handler = async () => {
      if (triedRef.current) return;
      triedRef.current = true;
      // 로그인 상태 가벼운 확인
      try {
        const me = await fetch(sameOriginApiUrl("/api/account/me"), { credentials: "include" });
        if (!me.ok) return;
        const data = (await me.json()) as { auth?: { id?: string } };
        if (!data.auth?.id) return;
      } catch {
        return;
      }
      await ensurePushSubscribed(VAPID_PUBLIC_KEY).catch(() => {});
    };
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  return null;
}
