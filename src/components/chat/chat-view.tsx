"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/domain";
import { useThreadRealtime } from "@/hooks/use-thread-realtime";
import { GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { FALLBACK_GUARDIAN_REQUEST_AVATAR } from "@/components/guardians/guardian-request-sheet";
import { cn } from "@/lib/utils";
import { Bot, Send } from "lucide-react";

interface ChatViewProps {
  threadId: string;
  /** 현재 사용자의 역할 — AI 배지 표시 여부 제어 */
  viewerRole: "traveler" | "guardian";
  otherDisplayName: string;
  otherAvatarUrl?: string | null;
  /** 전송 성공 시 상위(목록 미읽음 등) 갱신 */
  onMessageSent?: () => void;
}

export function ChatView({
  threadId,
  viewerRole,
  otherDisplayName,
  otherAvatarUrl,
  onMessageSent,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const avatarSrc = otherAvatarUrl ?? FALLBACK_GUARDIAN_REQUEST_AVATAR;

  /* 초기 메시지 로드 */
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/threads/${threadId}/messages`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then(({ messages: loaded }: { messages: ChatMessage[] }) => setMessages(loaded))
      .finally(() => setIsLoading(false));
  }, [threadId]);

  /* Realtime 구독 */
  useThreadRealtime(threadId, (newMsg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  });

  /* 자동 스크롤 */
  useEffect(() => {
    const id = setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      80,
    );
    return () => clearTimeout(id);
  }, [messages]);

  /* 포커스 */
  useEffect(() => {
    if (!isLoading) {
      const id = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(id);
    }
  }, [isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isSending) return;
      const optimisticId = `opt-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        thread_id: threadId,
        sender_user_id: "me",
        sender_role: viewerRole,
        content: text.trim(),
        content_type: "text",
        is_read: false,
        is_ai_reply: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setInput("");
      setIsSending(true);
      setSendError(null);

      try {
        const res = await fetch(`/api/threads/${threadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text.trim() }),
        });
        const raw = (await res.json().catch(() => null)) as
          | { message: ChatMessage }
          | { error?: string; detail?: string }
          | null;
        if (!res.ok) {
          const human =
            raw && "error" in raw && raw.error === "traveler_message_limit" && typeof raw.detail === "string"
              ? raw.detail
              : "메시지를 보내지 못했어요.";
          setSendError(human);
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          return;
        }
        if (raw && "message" in raw && raw.message && typeof raw.message === "object" && "id" in raw.message) {
          setMessages((prev) => prev.map((m) => (m.id === optimisticId ? raw.message : m)));
          onMessageSent?.();
        }
      } catch {
        setSendError("네트워크 오류가 발생했어요.");
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      } finally {
        setIsSending(false);
      }
    },
    [threadId, isSending, viewerRole, onMessageSent],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void sendMessage(input);
      }
    },
    [input, sendMessage],
  );

  const isMyMessage = (msg: ChatMessage) => msg.sender_role === viewerRole;

  return (
    <div className="flex h-full flex-col">
      {/* 메시지 영역 */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
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
        ) : messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">아직 메시지가 없어요. 먼저 인사해 보세요 😊</p>
          </div>
        ) : (
          messages.map((msg) =>
            isMyMessage(msg) ? (
              /* 내 메시지 — 오른쪽 */
              <div key={msg.id} className="mb-3 flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-[var(--brand-primary)] px-3.5 py-2.5">
                  <p className="text-sm leading-relaxed text-white">{msg.content}</p>
                </div>
              </div>
            ) : (
              /* 상대방 메시지 — 왼쪽 */
              <div key={msg.id} className="mb-3 flex items-end gap-2">
                <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-border/40">
                  <Image
                    src={avatarSrc}
                    alt={otherDisplayName}
                    fill
                    className={cn(GUARDIAN_AVATAR_COVER_CLASS)}
                    sizes="32px"
                  />
                  {/* AI 배지 — 가디언 뷰에서만 */}
                  {msg.is_ai_reply && viewerRole === "guardian" && (
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-violet-500 ring-1 ring-white">
                      <Bot className="size-2.5 text-white" />
                    </span>
                  )}
                </div>
                <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-card px-3.5 py-2.5 shadow-[var(--shadow-sm)]">
                  {msg.is_ai_reply && viewerRole === "guardian" && (
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-violet-500">
                      <Bot className="size-3" aria-hidden />
                      AI 자동답변
                    </p>
                  )}
                  <p className="text-sm leading-relaxed text-foreground">{msg.content}</p>
                </div>
              </div>
            ),
          )
        )}

        {isSending && (
          <div className="mb-3 flex items-end gap-2">
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-border/40">
              <Image src={avatarSrc} alt="" fill className={cn(GUARDIAN_AVATAR_COVER_CLASS)} sizes="32px" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-card px-3.5 py-3 shadow-[var(--shadow-sm)]">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 바 */}
      <div className="shrink-0 border-t border-border/50 bg-card px-3 py-3">
        {sendError ? (
          <p className="text-destructive mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs leading-relaxed">{sendError}</p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSendError(null);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="메시지 입력… (Enter 전송)"
            rows={1}
            maxLength={500}
            disabled={isSending}
            className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-[var(--brand-primary)]/60 focus:outline-none disabled:opacity-50"
            style={{ minHeight: "42px" }}
          />
          <button
            type="button"
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || isSending}
            aria-label="전송"
            className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-sm transition-opacity disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
