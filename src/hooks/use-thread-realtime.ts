"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/domain";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

/**
 * 메시지 실시간 수신.
 *
 * 1) Supabase Realtime postgres_changes — 실 사용자(JWT 보유) 케이스.
 * 2) 폴링 백업 — 모의 하루이(JWT 미보유) 또는 Realtime 실패 케이스.
 *    `lastSeenIso`를 기준으로 created_at > lastSeenIso 메시지만 fetch.
 *    Realtime 채널이 열려도 폴링은 백업으로 유지(저빈도).
 *
 * threadId가 null이면 구독·폴링 둘 다 비활성.
 */
export function useThreadRealtime(
  threadId: string | null,
  onNewMessage: (msg: ChatMessage) => void,
) {
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;
  const lastIsoRef = useRef<string>(new Date().toISOString());
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!threadId) return;
    // 스레드가 바뀌면 dedup 캐시 리셋
    seenIdsRef.current = new Set();
    lastIsoRef.current = new Date(Date.now() - 1000).toISOString();

    const emit = (msg: ChatMessage) => {
      if (!msg?.id || seenIdsRef.current.has(msg.id)) return;
      seenIdsRef.current.add(msg.id);
      if (msg.created_at && msg.created_at > lastIsoRef.current) {
        lastIsoRef.current = msg.created_at;
      }
      callbackRef.current(msg);
    };

    // ── (1) Realtime (실 JWT 보유 사용자에게만 작동) ────────────────────────
    const sb = createSupabaseBrowserClient();
    let channel: ReturnType<NonNullable<typeof sb>["channel"]> | null = null;
    if (sb) {
      channel = sb
        .channel(`thread:${threadId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `thread_id=eq.${threadId}`,
          },
          (payload) => {
            emit(payload.new as ChatMessage);
          },
        )
        .subscribe();
    }

    // ── (2) 폴링 백업: 3초마다 신규 메시지 fetch ─────────────────────────────
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(
          `/api/threads/${threadId}/messages?since=${encodeURIComponent(lastIsoRef.current)}`,
          { credentials: "include", cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { messages?: ChatMessage[] };
        const list = Array.isArray(data.messages) ? data.messages : [];
        for (const m of list) emit(m);
      } catch {
        // silent
      }
    };
    const pollId = window.setInterval(poll, 3000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisible);
      if (channel && sb) void sb.removeChannel(channel);
    };
  }, [threadId]);
}
