"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChatView } from "@/components/chat/chat-view";
import { GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { FALLBACK_GUARDIAN_REQUEST_AVATAR } from "@/components/guardians/guardian-request-sheet";
import { cn } from "@/lib/utils";
import type { MessageThread } from "@/types/domain";
import { MessageCircle } from "lucide-react";

interface ThreadWithMeta extends MessageThread {
  other_display_name: string;
  other_avatar_url: string | null;
  last_message_preview: string | null;
}

interface Props {
  /** "traveler" | "guardian" — determines AI badge visibility */
  viewerRole: "traveler" | "guardian";
  /** 현재 로그인 사용자 ID — opposite party 식별에 사용 */
  viewerUserId: string;
}

export function ThreadListClient({ viewerRole, viewerUserId }: Props) {
  const [threads, setThreads] = useState<ThreadWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/threads")
      .then((r) => (r.ok ? r.json() : { threads: [] }))
      .then(({ threads: list }: { threads: MessageThread[] }) => {
        // TODO(prod): 서버에서 join으로 display_name, avatar, preview를 내려주도록 개선
        // 현재는 기본값으로 렌더
        setThreads(
          list.map((t) => ({
            ...t,
            other_display_name:
              viewerRole === "traveler" ? "하루이" : "여행자",
            other_avatar_url: null,
            last_message_preview: t.last_message_at
              ? `마지막 메시지: ${new Date(t.last_message_at).toLocaleDateString("ko")}`
              : null,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, [viewerRole, viewerUserId]);

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
      {/* 스레드 목록 */}
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
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t.other_display_name}</p>
              {t.last_message_preview && (
                <p className="line-clamp-1 text-[11px] text-muted-foreground">
                  {t.last_message_preview}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* 채팅 뷰 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selected ? (
          <>
            {/* 채팅 헤더 */}
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
