"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatView } from "@/components/chat/chat-view";
import { GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { FALLBACK_GUARDIAN_REQUEST_AVATAR } from "@/components/guardians/guardian-request-sheet";
import { cn } from "@/lib/utils";
import type { MessageThreadListRow } from "@/types/domain";
import { MessageCircle } from "lucide-react";

interface Props {
  viewerRole: "traveler" | "guardian";
  viewerUserId: string;
}

const POLL_MS = 18_000;

export function ThreadListClient({ viewerRole, viewerUserId }: Props) {
  const [threads, setThreads] = useState<MessageThreadListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const mounted = useRef(true);

  const loadThreads = useCallback(async () => {
    try {
      const r = await fetch("/api/threads", { credentials: "include" });
      const raw = (await r.json().catch(() => ({}))) as {
        threads?: MessageThreadListRow[];
        error?: string;
        detail?: string;
      };
      if (!r.ok) {
        if (mounted.current)
          setListError(
            typeof raw.detail === "string" ? raw.detail : raw.error ?? "목록을 불러오지 못했어요.",
          );
        return;
      }
      if (mounted.current) {
        setListError(null);
        setThreads(raw.threads ?? []);
      }
    } catch {
      if (mounted.current) setListError("네트워크 오류가 발생했어요.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void loadThreads();
    return () => {
      mounted.current = false;
    };
  }, [loadThreads, viewerUserId]);

  useEffect(() => {
    const id = setInterval(() => void loadThreads(), POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void loadThreads();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [loadThreads]);

  useEffect(() => {
    if (threads.length === 0) return;
    if (!selectedId || !threads.some((t) => t.id === selectedId)) {
      setSelectedId(threads[0].id);
    }
  }, [threads, selectedId]);

  const selected = threads.find((t) => t.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex gap-1">
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="size-2 animate-bounce rounded-full bg-muted-foreground/40"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (listError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-destructive">{listError}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadThreads();
          }}
          className="text-primary text-sm font-semibold underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MessageCircle className="size-7" />
        </div>
        <p className="text-sm text-muted-foreground">아직 대화가 없어요.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-12rem)] gap-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-sm)]">
      <div className="w-full shrink-0 overflow-y-auto border-r border-border/50 sm:w-64 md:w-72">
        {threads.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedId(t.id)}
            className={cn(
              "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50",
              selectedId === t.id && "bg-primary/5",
            )}
          >
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border/40">
              <Image
                src={t.other_avatar_url ?? FALLBACK_GUARDIAN_REQUEST_AVATAR}
                alt={t.other_display_name}
                fill
                className={cn(GUARDIAN_AVATAR_COVER_CLASS)}
                sizes="40px"
              />
              {t.unread_count > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-[1.1rem] items-center justify-center rounded-full bg-[var(--brand-primary)] px-1 text-[10px] font-bold text-white shadow">
                  {t.unread_count > 9 ? "9+" : t.unread_count}
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t.other_display_name}</p>
              {t.last_message_preview ? (
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{t.last_message_preview}</p>
              ) : t.last_message_at ? (
                <p className="line-clamp-1 text-[11px] text-muted-foreground">
                  {new Date(t.last_message_at).toLocaleDateString("ko")}
                </p>
              ) : null}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b border-border/50 px-4 py-3">
              <div className="relative size-8 overflow-hidden rounded-full border border-border/40">
                <Image
                  src={selected.other_avatar_url ?? FALLBACK_GUARDIAN_REQUEST_AVATAR}
                  alt={selected.other_display_name}
                  fill
                  className={cn(GUARDIAN_AVATAR_COVER_CLASS)}
                  sizes="32px"
                />
              </div>
              <p className="text-sm font-semibold text-foreground">{selected.other_display_name}</p>
            </div>
            <ChatView
              threadId={selected.id}
              viewerRole={viewerRole}
              otherDisplayName={selected.other_display_name}
              otherAvatarUrl={selected.other_avatar_url}
              onMessageSent={() => void loadThreads()}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">대화를 선택해 주세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
