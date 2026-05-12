"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { sameOriginApiUrl } from "@/lib/api-origin";
import { MYPAGE_ATTENTION_UPDATED_EVENT } from "@/lib/mypage-attention-events";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { ChatMessage } from "@/types/domain";
import { emitInboundMessage } from "@/lib/inbound-notify";

const POLL_MS = 60 * 1000;

type MeFull = { auth?: { id?: string }; user?: { id?: string; app_role?: string } | null };

export function HeaderInboxButton({ onDarkSurface }: { onDarkSurface: boolean }) {
  const [unread, setUnread] = useState<number>(0);
  const [role, setRole] = useState<string>("traveler");
  const [meUserId, setMeUserId] = useState<string | null>(null);

  const loadUnread = useCallback(async () => {
    try {
      const res = await fetch(sameOriginApiUrl("/api/notifications/unread"), { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages_unread_total: number };
      setUnread(Number(data.messages_unread_total) || 0);
    } catch {
      // silent
    }
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch(sameOriginApiUrl("/api/account/me"), { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as MeFull;
      setRole(data.user?.app_role ?? "traveler");
      const uid = data.user?.id ?? data.auth?.id ?? null;
      if (uid) setMeUserId(uid);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    void loadUnread();
    void loadMe();
    const id = window.setInterval(loadUnread, POLL_MS);
    const onAttention = () => void loadUnread();
    window.addEventListener(MYPAGE_ATTENTION_UPDATED_EVENT, onAttention);
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadUnread();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(MYPAGE_ATTENTION_UPDATED_EVENT, onAttention);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadUnread, loadMe]);

  /* PR-J: Realtime — 새 메시지 INSERT 시 즉시 배지 갱신 + 알림 emit */
  useEffect(() => {
    if (!meUserId) return;
    const sb = createSupabaseBrowserClient();
    if (!sb) return;
    const channel = sb
      .channel(`user-notif:${meUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as ChatMessage & { sender_user_id?: string };
          // 본인이 보낸 메시지는 알림 X (RLS는 본인이 참여한 스레드만 통과시키지만 sender 체크 추가)
          if (!msg || msg.sender_user_id === meUserId) return;
          // 즉시 unread 1 증가(낙관) + 정확한 값 한번 더 fetch
          setUnread((n) => n + 1);
          void loadUnread();
          // 알림 emit (브릿지가 토스트/사운드/데스크톱 처리)
          emitInboundMessage({ message: msg as ChatMessage });
        },
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [meUserId, loadUnread]);

  const href = role === "guardian" ? "/mypage/guardian/messages" : "/mypage/messages";
  const label = unread > 0 ? `메시지 ${unread > 9 ? "9+" : unread}건` : "메시지함";
  const display = unread > 9 ? "9+" : String(unread);

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "relative inline-flex h-9 min-h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
        onDarkSurface
          ? "border-white/25 bg-white/10 text-white hover:bg-white/16"
          : "border-border/80 bg-background hover:bg-muted/80",
      )}
    >
      <MessageCircle className="size-4 shrink-0" aria-hidden />
      {unread > 0 ? (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm"
        >
          {display}
        </span>
      ) : null}
    </Link>
  );
}
