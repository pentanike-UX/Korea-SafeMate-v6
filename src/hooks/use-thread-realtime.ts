"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/domain";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

/**
 * Supabase Realtime — messages 테이블에서 특정 thread_id 신규 메시지 구독.
 * threadId가 null이면 구독하지 않음.
 */
export function useThreadRealtime(
  threadId: string | null,
  onNewMessage: (msg: ChatMessage) => void,
) {
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  useEffect(() => {
    if (!threadId) return;

    const sb = createSupabaseBrowserClient();
    if (!sb) return;

    const channel = sb
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
          callbackRef.current(payload.new as ChatMessage);
        },
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [threadId]);
}
