"use client";

/**
 * 헤더 메신저 아이콘 + 미읽음 빨간 배지.
 * - 30초마다 /api/notifications/unread 폴링
 * - visibility 복귀 시 즉시 갱신
 * - 실 사용자: /mypage/messages 로 이동
 * - 모의 하루이/실 하루이: /mypage/guardian/messages 로 이동
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { sameOriginApiUrl } from "@/lib/api-origin";

const POLL_MS = 30 * 1000;

type Counts = { messages_unread_total: number; threads_unread_total: number };

type Me = {
  auth?: { id?: string | null } | null;
  user?: { id?: string | null; app_role?: string | null } | null;
};

export function HeaderInboxButton({ onDarkSurface }: { onDarkSurface: boolean }) {
  const [counts, setCounts] = useState<Counts>({ messages_unread_total: 0, threads_unread_total: 0 });
  const [role, setRole] = useState<string>("traveler");
  const [authed, setAuthed] = useState<boolean>(false);

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch(sameOriginApiUrl("/api/notifications/unread"), {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as Counts;
      setCounts({
        messages_unread_total: Number(data.messages_unread_total ?? 0),
        threads_unread_total: Number(data.threads_unread_total ?? 0),
      });
    } catch {
      // silent
    }
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch(sameOriginApiUrl("/api/account/me"), { credentials: "include" });
      if (!res.ok) {
        setAuthed(false);
        return;
      }
      const data = (await res.json()) as Me;
      const r = data.user?.app_role ?? "traveler";
      setRole(r);
      setAuthed(Boolean(data.auth?.id || data.user?.id));
    } catch {
      setAuthed(false);
    }
  }, []);

  useEffect(() => {
    void loadMe();
    void loadCounts();
    const id = window.setInterval(loadCounts, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadCounts();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadMe, loadCounts]);

  if (!authed) return null;

  const href = role === "guardian" ? "/mypage/guardian/messages" : "/mypage/messages";
  // 헤더 빨간 점 배지는 "스레드 단위"가 더 명료(여러 메시지가 한 스레드면 1로 보이게)
  const badgeCount = counts.threads_unread_total || counts.messages_unread_total;
  const display = badgeCount > 9 ? "9+" : String(badgeCount);
  const aria = badgeCount > 0 ? `읽지 않은 메시지 ${display}건` : "메시지함";

  return (
    <Link
      href={href}
      aria-label={aria}
      title={aria}
      className={cn(
        "relative inline-flex h-9 min-h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
        onDarkSurface
          ? "border-white/25 bg-white/10 text-white hover:bg-white/16"
          : "border-border/80 bg-background hover:bg-muted/80",
      )}
    >
      <MessageCircle className="size-4 shrink-0" aria-hidden />
      {badgeCount > 0 ? (
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
