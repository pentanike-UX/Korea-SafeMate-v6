"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  FALLBACK_GUARDIAN_REQUEST_AVATAR,
  GUARDIAN_REQUEST_DEFAULTS_EVENT,
} from "@/components/guardians/guardian-request-sheet";
import { GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { useThreadRealtime } from "@/hooks/use-thread-realtime";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/domain";
import { Bot, Send, X } from "lucide-react";

export const GUARDIAN_INQUIRY_OPEN_EVENT = "safemate:open-guardian-inquiry";

export type GuardianInquiryOpenDetail = {
  guardianUserId?: string;
  displayName?: string;
  avatarUrl?: string;
  headline?: string;
};

const QUICK_REPLIES = [
  "이 루트 동행 가능한가요?",
  "일정 조율할 수 있나요?",
  "비슷한 다른 루트도 있나요?",
  "식당 선택 도움 받을 수 있나요?",
];

/** 전역 이벤트로 문의 시트를 여는 트리거 버튼 */
export function GuardianInquiryOpenTrigger({
  detail,
  className,
  children,
}: {
  detail?: GuardianInquiryOpenDetail;
  className?: string;
  children?: React.ReactNode;
}) {
  const handleClick = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent<GuardianInquiryOpenDetail>(GUARDIAN_INQUIRY_OPEN_EVENT, {
        detail: detail ?? {},
      }),
    );
  }, [detail]);

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children ?? "문의하기"}
    </button>
  );
}

/** public-site-shell.tsx에 한 번만 마운트 — 채팅 형식 문의 시트 (실 API 연결) */
export function GuardianInquirySheetGlobal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<GuardianInquiryOpenDetail>({});
  const [defaults, setDefaults] = useState<GuardianInquiryOpenDetail>({});

  // 채팅 상태
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* 페이지 레벨 가디언 기본값 수신 */
  useEffect(() => {
    const onDefaults = (e: Event) => setDefaults((e as CustomEvent).detail ?? {});
    window.addEventListener(GUARDIAN_REQUEST_DEFAULTS_EVENT, onDefaults);
    return () => window.removeEventListener(GUARDIAN_REQUEST_DEFAULTS_EVENT, onDefaults);
  }, []);

  /* 문의 시트 열기 이벤트 수신 */
  useEffect(() => {
    const onOpen = async (e: Event) => {
      const d: GuardianInquiryOpenDetail =
        (e as CustomEvent<GuardianInquiryOpenDetail>).detail ?? {};
      setDetail(d);
      setInput("");
      setAuthRequired(false);
      setMessages([]);
      setThreadId(null);
      setOpen(true);

      if (!d.guardianUserId) return;

      setIsLoading(true);
      try {
        // 스레드 생성 or 기존 반환
        const res = await fetch("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guardian_user_id: d.guardianUserId }),
        });

        if (res.status === 401) {
          setAuthRequired(true);
          setIsLoading(false);
          return;
        }

        if (!res.ok) throw new Error("Thread init failed");
        const { thread } = (await res.json()) as { thread: { id: string } };
        setThreadId(thread.id);

        // 기존 메시지 로드
        const msgRes = await fetch(`/api/threads/${thread.id}/messages`);
        if (msgRes.ok) {
          const { messages: existing } = (await msgRes.json()) as { messages: ChatMessage[] };
          setMessages(existing ?? []);
        }
      } catch {
        // 비인증 상태 or 네트워크 오류 → 가이드 메시지 표시
        setMessages([
          {
            id: "welcome",
            thread_id: "",
            sender_user_id: d.guardianUserId ?? "",
            sender_role: "guardian",
            content: "안녕하세요! 😊 궁금한 점이 있으시면 편하게 물어보세요.",
            content_type: "text",
            is_read: false,
            is_ai_reply: false,
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    window.addEventListener(GUARDIAN_INQUIRY_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(GUARDIAN_INQUIRY_OPEN_EVENT, onOpen);
  }, []);

  /* Realtime 구독: 새 메시지 수신 */
  useThreadRealtime(threadId, (newMsg) => {
    setMessages((prev) => {
      // 낙관적 업데이트로 이미 추가된 경우 중복 방지
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  });

  /* 메시지 하단 자동 스크롤 */
  useEffect(() => {
    const id = setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      80,
    );
    return () => clearTimeout(id);
  }, [messages]);

  /* 시트 열릴 때 input 포커스 */
  useEffect(() => {
    if (open && !authRequired) {
      const id = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(id);
    }
  }, [open, authRequired]);

  const resolved = {
    displayName: detail.displayName ?? defaults.displayName ?? "하루이",
    avatarUrl: detail.avatarUrl ?? defaults.avatarUrl ?? FALLBACK_GUARDIAN_REQUEST_AVATAR,
    headline: detail.headline ?? defaults.headline ?? "현지 전문 하루이",
    guardianUserId: detail.guardianUserId ?? defaults.guardianUserId ?? "",
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isSending) return;
      if (!threadId) return;

      const optimisticId = `opt-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: optimisticId,
        thread_id: threadId,
        sender_user_id: "me",
        sender_role: "traveler",
        content: text.trim(),
        content_type: "text",
        is_read: false,
        is_ai_reply: false,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setInput("");
      setIsSending(true);

      try {
        const res = await fetch(`/api/threads/${threadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text.trim() }),
        });
        if (!res.ok) throw new Error("Send failed");
        const { message } = (await res.json()) as { message: ChatMessage };
        // 낙관적 메시지를 실제 ID로 교체
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? message : m)),
        );
      } catch {
        // 실패 시 낙관적 메시지 제거
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      } finally {
        setIsSending(false);
      }
    },
    [threadId, isSending],
  );

  const handleSend = useCallback(() => sendMessage(input), [input, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const showQuickReplies =
    !isLoading && messages.filter((m) => m.sender_role === "traveler").length === 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[400px]"
        aria-label={`${resolved.displayName}에게 문의`}
      >
        {/* ── 헤더 ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border/50 bg-card px-4 py-3.5">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border/40">
            <Image
              src={resolved.avatarUrl}
              alt={resolved.displayName}
              fill
              className={cn(GUARDIAN_AVATAR_COVER_CLASS)}
              sizes="40px"
            />
            <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight text-foreground">
              {resolved.displayName}
            </p>
            <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
              지금 온라인 · 빠른 응답
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── 채팅 영역 ── */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-[var(--bg-page,hsl(var(--background)))] px-4 py-4">
          {/* 비인증 안내 */}
          {authRequired ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="text-base font-semibold text-foreground">로그인이 필요해요</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                하루이에게 문의하려면 먼저 로그인해 주세요.
              </p>
              <a
                href="/auth/login"
                className="mt-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                로그인하기
              </a>
            </div>
          ) : isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex items-center gap-1.5">
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) =>
                msg.sender_role !== "traveler" ? (
                  /* 가디언 / AI 메시지 — 왼쪽 */
                  <div key={msg.id} className="mb-3 flex items-end gap-2">
                    <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-border/40">
                      <Image
                        src={resolved.avatarUrl}
                        alt=""
                        fill
                        className={cn(GUARDIAN_AVATAR_COVER_CLASS)}
                        sizes="28px"
                      />
                      {/* AI 답변 배지 — 가디언 뷰에서만 의미 있지만 여기선 아이콘으로 표시 */}
                      {msg.is_ai_reply && (
                        <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-violet-500 ring-1 ring-white">
                          <Bot className="size-2 text-white" />
                        </span>
                      )}
                    </div>
                    <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-card px-3.5 py-2.5 shadow-[var(--shadow-sm)]">
                      <p className="text-sm leading-relaxed text-foreground">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  /* 여행자 메시지 — 오른쪽 */
                  <div key={msg.id} className="mb-3 flex justify-end">
                    <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-[var(--brand-primary)] px-3.5 py-2.5">
                      <p className="text-sm leading-relaxed text-white">{msg.content}</p>
                    </div>
                  </div>
                ),
              )}

              {/* 전송 중 표시 */}
              {isSending && (
                <div className="mb-3 flex items-end gap-2">
                  <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-border/40">
                    <Image
                      src={resolved.avatarUrl}
                      alt=""
                      fill
                      className={cn(GUARDIAN_AVATAR_COVER_CLASS)}
                      sizes="28px"
                    />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-card px-3.5 py-3 shadow-[var(--shadow-sm)]">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {/* 빠른 선택 칩 */}
              {showQuickReplies && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void sendMessage(q)}
                      className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm transition-colors hover:border-[var(--brand-primary)]/50 hover:bg-[var(--brand-primary)]/5"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── 입력 바 ── */}
        {!authRequired && (
          <div className="shrink-0 border-t border-border/50 bg-card px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="메시지 입력… (Enter 전송, Shift+Enter 줄바꿈)"
                rows={1}
                maxLength={500}
                disabled={isSending || isLoading || !threadId}
                className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[var(--brand-primary)]/60 focus:outline-none disabled:opacity-50"
                style={{ minHeight: "42px" }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isSending || isLoading || !threadId}
                aria-label="전송"
                className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-sm transition-opacity disabled:opacity-40"
              >
                <Send className="size-4" aria-hidden />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              시간이 필요한 맞춤 의뢰는{" "}
              <span className="font-medium text-foreground">요청하기</span>를 이용하세요
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
