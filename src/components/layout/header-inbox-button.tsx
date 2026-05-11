"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { sameOriginApiUrl } from "@/lib/api-origin";
import { MYPAGE_ATTENTION_UPDATED_EVENT } from "@/lib/mypage-attention-events";

const POLL_MS = 60 * 1000;

type MeShape = { user?: { app_role?: string } | null };

export function HeaderInboxButton({ onDarkSurface }: { onDarkSurface: boolean }) {
  const [unread, setUnread] = useState<number>(0);
  const [role, setRole] = useState<string>("traveler");

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

  const loadRole = useCallback(async () => {
    try {
      const res = await fetch(sameOriginApiUrl("/api/account/me"), { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as MeShape;
      const r = data.user?.app_role ?? "traveler";
      setRole(r);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    void loadUnread();
    void loadRole();
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
  }, [loadUnread, loadRole]);

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
