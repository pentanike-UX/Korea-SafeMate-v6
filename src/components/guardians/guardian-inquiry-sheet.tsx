"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import {
  FALLBACK_GUARDIAN_REQUEST_AVATAR,
  GUARDIAN_REQUEST_DEFAULTS_EVENT,
} from "@/components/guardians/guardian-request-sheet";
import { GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { isUuidString } from "@/lib/guardian-posts-api";
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
  /** 문의 진입 포스트(선택) — 스레드 메타에 저장 */
  contentPostId?: string;
};

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
  const t = useTranslations("GuardianInquiry");
  const QUICK_REPLIES = useMemo(
    () => [t("quickReply1"), t("quickReply2"), t("quickReply3"), t("quickReply4")],
    [t],
  );

  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<GuardianInquiryOpenDetail>({});
  const [defaults, setDefaults] = useState<GuardianInquiryOpenDetail>({});

  // 채팅 상태
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  /** traveler 메시지 송신 직후 ~ AI/하루이 답변 도착 사이의 "타이핑 중" 인디케이터. */
  const [aiTyping, setAiTyping] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const aiTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 페이지 레벨 하루이 기본값 수신 */
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
      setSendError(null);
      setInquiryError(null);
      setOpen(true);

      if (!d.guardianUserId) return;

      setIsLoading(true);
      try {
        const payload: { guardian_user_id: string; content_post_id?: string } = {
          guardian_user_id: d.guardianUserId,
        };
        if (d.contentPostId && isUuidString(d.contentPostId)) {
          payload.content_post_id = d.contentPostId;
        }

        // 스레드 생성 or 기존 반환
        const res = await fetch("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.status === 401) {
          setAuthRequired(true);
          setIsLoading(false);
          return;
        }

        const resBody = (await res.json().catch(() => (null))) as
          | { thread?: { id?: string }; error?: string; detail?: string }
          | null;

        if (!res.ok) {
          const msg =
            resBody && typeof resBody.detail === "string"
              ? resBody.detail
              : resBody && typeof resBody.error === "string"
                ? resBody.error
                : t("inquiryStartErrorWithStatus", { status: res.status });
          setInquiryError(msg);
          setMessages([]);
          return;
        }

        const body = resBody;
        const tid = body?.thread?.id;
        if (!tid) {
          setInquiryError(t("inquiryBadResponse"));
          setMessages([]);
          return;
        }
        setThreadId(tid);

        // 기존 메시지 로드
        const msgRes = await fetch(`/api/threads/${tid}/messages`);
        if (msgRes.ok) {
          const { messages: existing } = (await msgRes.json()) as { messages: ChatMessage[] };
          setMessages(existing ?? []);
        }
      } catch {
        setInquiryError(t("networkErrorStart"));
        setMessages([]);
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
    // 가디언/AI 응답이 도착하면 타이핑 인디케이터 해제.
    if (newMsg.sender_role !== "traveler") {
      setAiTyping(false);
      if (aiTypingTimerRef.current) {
        clearTimeout(aiTypingTimerRef.current);
        aiTypingTimerRef.current = null;
      }
    }
  });

  /* 시트 닫힐 때 타이머 정리 */
  useEffect(() => {
    if (!open && aiTypingTimerRef.current) {
      clearTimeout(aiTypingTimerRef.current);
      aiTypingTimerRef.current = null;
      setAiTyping(false);
    }
  }, [open]);

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
    displayName: detail.displayName ?? defaults.displayName ?? t("defaultGuardianName"),
    avatarUrl: detail.avatarUrl ?? defaults.avatarUrl ?? FALLBACK_GUARDIAN_REQUEST_AVATAR,
    headline: detail.headline ?? defaults.headline ?? t("defaultGuardianHeadline"),
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
              : t("sendErrorGeneric");
          setSendError(human);
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          return;
        }
        if (raw && "message" in raw && raw.message && typeof raw.message === "object" && "id" in raw.message) {
          setMessages((prev) => {
            const next = prev.map((m) => (m.id === optimisticId ? raw.message : m));
            const seen = new Set<string>();
            return next.filter((m) => {
              if (seen.has(m.id)) return false;
              seen.add(m.id);
              return true;
            });
          });
        }
        // traveler 메시지 송신 성공 → 가디언/AI 응답 기다리는 동안 타이핑 인디케이터 표시.
        // AI 자동답변(`triggerAiReplyWithServiceRole`)은 보통 2~6초 안에 도착하므로
        // 12초 후 자동 해제하여 가디언이 자리 비웠을 때 무한 표시되지 않도록.
        setAiTyping(true);
        if (aiTypingTimerRef.current) clearTimeout(aiTypingTimerRef.current);
        aiTypingTimerRef.current = setTimeout(() => {
          setAiTyping(false);
          aiTypingTimerRef.current = null;
        }, 12000);
      } catch {
        setSendError(t("networkErrorSend"));
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      } finally {
        setIsSending(false);
      }
    },
    [threadId, isSending, t],
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
    !inquiryError &&
    !isLoading &&
    messages.filter((m) => m.sender_role === "traveler").length === 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[400px]"
        aria-label={t("ariaLabelChatWith", { name: resolved.displayName })}
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
              {t("statusOnlineNow")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("closeAria")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── 채팅 영역 ── */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-[var(--bg-page,hsl(var(--background)))] px-4 py-4">
          {/* 비인증 안내 */}
          {authRequired ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="text-base font-semibold text-foreground">{t("authRequiredTitle")}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("authRequiredBody")}
              </p>
              <Link
                href="/login"
                className="mt-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                {t("authRequiredCta")}
              </Link>
            </div>
          ) : inquiryError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-3 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">{inquiryError}</p>
              <button
                type="button"
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-muted/50"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent<GuardianInquiryOpenDetail>(GUARDIAN_INQUIRY_OPEN_EVENT, {
                      detail: { ...detail },
                    }),
                  );
                }}
              >
                {t("retryCta")}
              </button>
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
                  /* 하루이 / AI 메시지 — 왼쪽 */
                  <div key={msg.id} className="mb-3 flex items-end gap-2">
                    <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-border/40">
                      <Image
                        src={resolved.avatarUrl}
                        alt=""
                        fill
                        className={cn(GUARDIAN_AVATAR_COVER_CLASS)}
                        sizes="28px"
                      />
                      {/* AI 답변 배지 — 하루이 뷰에서만 의미 있지만 여기선 아이콘으로 표시 */}
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

              {/* 전송 중 / AI 타이핑 표시 — traveler 메시지 송신 직후 또는 가디언 답변 대기 동안 */}
              {(isSending || aiTyping) && (
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
        {!authRequired && !inquiryError && (
          <div className="shrink-0 border-t border-border/50 bg-card px-3 py-3">
            {sendError ? (
              <p className="text-destructive mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs leading-relaxed">
                {sendError}
              </p>
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
                placeholder={t("inputPlaceholder")}
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
                aria-label={t("sendAria")}
                className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-sm transition-opacity disabled:opacity-40"
              >
                <Send className="size-4" aria-hidden />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              {t("inquiryHintFooterPrefix")}{" "}
              <span className="font-medium text-foreground">{t("inquiryHintFooterRequestWord")}</span>
              {" "}{t("inquiryHintFooterSuffix")}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
