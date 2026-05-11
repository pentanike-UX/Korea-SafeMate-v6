"use client";

import { useEffect } from "react";

/**
 * 가디언 워크스페이스 진입 시 last_seen_at heartbeat.
 * - 마운트 즉시 1회 + 4분 간격(<5분 윈도) 갱신.
 * - 페이지 visibility 가 hidden→visible 전환 시도 1회.
 * - 실패해도 UI 무영향(silent).
 */
export function GuardianPresenceHeartbeat() {
  useEffect(() => {
    let cancelled = false;
    const ping = () => {
      if (cancelled) return;
      void fetch("/api/guardians/presence", { method: "POST", credentials: "include" }).catch(() => {});
    };
    ping();
    const id = window.setInterval(ping, 4 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
