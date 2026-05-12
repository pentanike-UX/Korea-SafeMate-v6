"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ChatView } from "@/components/chat/chat-view";
import { GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { FALLBACK_GUARDIAN_REQUEST_AVATAR } from "@/components/guardians/guardian-request-sheet";
import { isGuardianOnline } from "@/lib/guardian-online";
import { cn } from "@/lib/utils";
import type { ChatMessage, MessageThreadWithMeta } from "@/types/domain";
import { MessageCircle, Bot } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

interface Props {
  /** "traveler" | "guardian" — AI 배지·헤더 라벨 분기 */
  viewerRole: "traveler" | "guardian";
  /** 현재 로그인 사용자 ID */
  viewerUserId: string;
}

/** 정렬: last_message_at desc nulls last */
function sortByLastMessage(a: MessageThreadWithMeta, b: MessageThreadWithMeta): number {
  const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
  const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
  return tb - ta;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  const diff = Date.now() - ts;
  if (diff < 60 * 1000) return "방금 전";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}시간 전`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

export function ThreadListClient({ viewerRole, viewerUserId }: Props) {
  const [threads, setThreads] = useState<MessageThreadWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const refetch = useCallback(() => {
    return fetch("/api/threads", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { threads: [] }))
      .then(({ threads: list }: { threads: MessageThreadWithMeta[] }) => {
        setThreads(list ?? []);
      });
  }, []);

  useEffect(() => {
    void refetch().finally(() => setLoading(false));
  }, [refetch, viewerRole]);

  /* PR-K: Realtime — 새 메시지 INSERT 시 해당 스레드 행 부분 갱신 */
  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    if (!sb) return;
    const channel = sb
      .channel(`inbox-list:${viewerUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as ChatMessage & { sender_user_id?: string };
          if (!msg?.thread_id) return;
          const isMine = msg.sender_user_id === viewerUserId;
          setThreads((prev) => {
            const idx = prev.findIndex((t) => t.id === msg.thread_id);
            if (idx < 0) {
              // 신규 스레드일 가능성 → 전체 재 fetch
              void refetch();
              return prev;
            }
            const copy = [...prev];
            const t = copy[idx]!;
            const preview = msg.content ? (msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content) : null;
            const becameUnread = !isMine && selectedIdRef.current !== msg.thread_id;
            copy[idx] = {
              ...t,
              last_message_at: msg.created_at ?? new Date().toISOString(),
              last_message_preview: preview,
              last_message_role: msg.sender_role,
              last_message_is_ai: !!msg.is_ai_reply,
              unread_count: becameUnread ? (t.unread_count ?? 0) + 1 : t.unread_count ?? 0,
            };
            return copy.sort(sortByLastMessage);
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_threads" },
        () => {
          // 신규 스레드(여행자 측에서 처음 생성) → 전체 재fetch
          void refetch();
        },
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [viewerUserId, refetch]);

  /* 선택한 스레드의 unread 0으로 (행 클릭 시 즉시) */
  useEffect(() => {
    if (!selectedId) return;
    setThreads((prev) => prev.map((t) => (t.id === selectedId ? { ...t, unread_count: 0 } : t)));
  }, [selectedId]);

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
      <div className="w-full shrink-0 overflow-y-auto border-r border-border/50 sm:w-72 md:w-80">
        {threads.map((t) => {
          const other = t.other;
          const name = other?.display_name ?? t.other_display_name ?? "사용자";
          const avatar = other?.avatar_url ?? t.other_avatar_url ?? FALLBACK_GUARDIAN_REQUEST_AVATAR;
          const online =
            other?.role === "guardian" && isGuardianOnline(other.last_seen_at);
          const isAi = t.last_message_is_ai;
          const preview = t.last_message_preview ?? null;
          const stamp = relativeTime(t.last_message_at);
          const unread = t.unread_count ?? 0;
          const sp = t.source_post ?? null;
          const isSelected = selectedId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              className={cn(
                "flex w-full items-start gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                isSelected && "bg-primary/5",
              )}
            >
              <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-border/40">
                <Image src={avatar} alt={name} fill className={cn(GUARDIAN_AVATAR_COVER_CLASS)} sizes="44px" />
                {online ? (
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" aria-label="온라인" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("truncate text-sm font-semibold", unread > 0 ? "text-foreground" : "text-foreground/80")}>{name}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{stamp}</span>
                </div>
                {sp ? (
                  <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--brand-primary)]">📍 {sp.title}</p>
                ) : null}
                {preview ? (
                  <p
                    className={cn(
                      "mt-0.5 line-clamp-1 flex items-center gap-1 text-xs",
                      unread > 0 ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {isAi ? <Bot className="size-3 shrink-0 text-violet-500" aria-hidden /> : null}
                    {preview}
                  </p>
                ) : null}
              </div>
              {unread > 0 ? (
                <span
                  aria-label={`읽지 않은 메시지 ${unread}건`}
                  className="ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-none text-white"
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 채팅 뷰 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selected ? (
          <>
            {/* 채팅 헤더 — 아바타 + 이름 + 온라인 + 출처 포스트 칩 */}
            <div className="flex shrink-0 items-center gap-3 border-b border-border/50 px-4 py-3">
              <div className="relative size-9 overflow-hidden rounded-full border border-border/40">
                <Image
                  src={selected.other?.avatar_url ?? selected.other_avatar_url ?? FALLBACK_GUARDIAN_REQUEST_AVATAR}
                  alt={selected.other?.display_name ?? selected.other_display_name ?? ""}
                  fill
                  className={cn(GUARDIAN_AVATAR_COVER_CLASS)}
                  sizes="36px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight text-foreground">
                  {selected.other?.display_name ?? selected.other_display_name}
                </p>
                {selected.source_post ? (
                  <Link
                    href={`/posts/${selected.source_post.id}`}
                    className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--brand-primary)] hover:underline"
                    title={selected.source_post.title}
                  >
                    📍 {selected.source_post.title}
                  </Link>
                ) : null}
              </div>
            </div>
            <ChatView
              threadId={selected.id}
              viewerRole={viewerRole}
              otherDisplayName={selected.other?.display_name ?? selected.other_display_name}
              otherAvatarUrl={selected.other?.avatar_url ?? selected.other_avatar_url}
            />
          </>
        ) : (
          <div className="hidden flex-1 items-center justify-center sm:flex">
            <p className="text-sm text-muted-foreground">대화를 선택해 주세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
