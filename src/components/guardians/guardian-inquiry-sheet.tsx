"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { FALLBACK_GUARDIAN_REQUEST_AVATAR, GUARDIAN_REQUEST_DEFAULTS_EVENT } from "@/components/guardians/guardian-request-sheet";
import { GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { cn } from "@/lib/utils";
import { Send, X } from "lucide-react";

export const GUARDIAN_INQUIRY_OPEN_EVENT = "safemate:open-guardian-inquiry";

export type GuardianInquiryOpenDetail = {
  guardianUserId?: string;
  displayName?: string;
  avatarUrl?: string;
  headline?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "guardian";
  text: string;
};

/** 빠른 첫 메시지 선택 칩 */
const QUICK_REPLIES = [
  "이 루트 동행 가능한가요?",
  "일정 조율할 수 있나요?",
  "비슷한 다른 루트도 있나요?",
  "식당 선택 도움 받을 수 있나요?",
];

/** 사용자 메시지에 대한 모의 가디언 응답 */
function mockGuardianReply(userText: string): string {
  const t = userText.toLowerCase();
  if (t.includes("동행")) return "네, 동행 가능해요! 원하시는 날짜를 알려주시면 일정 확인해 드릴게요 😊";
  if (t.includes("일정") || t.includes("날짜")) return "일정 조율 가능해요. 몇 월 몇 주차를 생각하고 계신지 알려주세요!";
  if (t.includes("루트") || t.includes("비슷")) return "비슷한 분위기의 루트 몇 가지 더 있어요. 어떤 테마를 선호하시나요?";
  if (t.includes("식당") || t.includes("음식") || t.includes("알레르기")) return "식당 추천 도움 드릴 수 있어요! 알레르기나 선호하는 음식 스타일 알려주시면 맞춰 드릴게요.";
  return "감사합니다! 빠르게 확인하고 답변 드릴게요 🙏";
}

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
      new CustomEvent<GuardianInquiryOpenDetail>(GUARDIAN_INQUIRY_OPEN_EVENT, { detail: detail ?? {} }),
    );
  }, [detail]);

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children ?? "문의하기"}
    </button>
  );
}

/** public-site-shell.tsx에 한 번만 마운트 — 채팅 형식 문의 시트 */
export function GuardianInquirySheetGlobal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<GuardianInquiryOpenDetail>({});
  const [defaults, setDefaults] = useState<GuardianInquiryOpenDetail>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* 페이지 레벨 가디언 기본값 수신 */
  useEffect(() => {
    const onDefaults = (e: Event) => setDefaults((e as CustomEvent).detail ?? {});
    window.addEventListener(GUARDIAN_REQUEST_DEFAULTS_EVENT, onDefaults);
    return () => window.removeEventListener(GUARDIAN_REQUEST_DEFAULTS_EVENT, onDefaults);
  }, []);

  /* 시트 열기 이벤트 수신 */
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d: GuardianInquiryOpenDetail = (e as CustomEvent<GuardianInquiryOpenDetail>).detail ?? {};
      setDetail(d);
      setInput("");
      setIsTyping(false);
      /* 웰컴 메시지로 초기화 */
      setMessages([
        {
          id: "welcome",
          role: "guardian",
          text: "안녕하세요! 😊 궁금한 점이 있으시면 편하게 물어보세요.",
        },
      ]);
      setOpen(true);
    };
    window.addEventListener(GUARDIAN_INQUIRY_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(GUARDIAN_INQUIRY_OPEN_EVENT, onOpen);
  }, []);

  /* 새 메시지 올 때 스크롤 아래로 */
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
      return () => clearTimeout(id);
    }
  }, [messages, isTyping, open]);

  /* 시트 열릴 때 input 포커스 */
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(id);
    }
  }, [open]);

  const resolved = {
    displayName: detail.displayName ?? defaults.displayName ?? "하루이",
    avatarUrl: detail.avatarUrl ?? defaults.avatarUrl ?? FALLBACK_GUARDIAN_REQUEST_AVATAR,
    headline: detail.headline ?? defaults.headline ?? "현지 전문 하루이",
  };

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);
      /* 1~1.8초 후 모의 응답 */
      const delay = 900 + Math.random() * 900;
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: `g-${Date.now()}`, role: "guardian", text: mockGuardianReply(text) },
        ]);
      }, delay);
    },
    [],
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

  /* 첫 메시지 전: 빠른 선택 칩 표시 */
  const showQuickReplies = messages.length <= 1 && !isTyping;

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
          {/* 아바타 + 온라인 점 */}
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
            <p className="text-sm font-semibold leading-tight text-foreground">{resolved.displayName}</p>
            <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
              지금 온라인 · 빠른 응답
            </p>
          </div>
          {/* SheetContent의 기본 닫기 버튼 숨기고 별도 배치 */}
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
        <div className="flex flex-1 flex-col gap-0 overflow-y-auto bg-[var(--bg-page,hsl(var(--background)))] px-4 py-4">
          {messages.map((msg) =>
            msg.role === "guardian" ? (
              /* 가디언 메시지 — 왼쪽 */
              <div key={msg.id} className="mb-3 flex items-end gap-2">
                <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-border/40">
                  <Image src={resolved.avatarUrl} alt="" fill className={cn(GUARDIAN_AVATAR_COVER_CLASS)} sizes="28px" />
                </div>
                <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-card px-3.5 py-2.5 shadow-[var(--shadow-sm)]">
                  <p className="text-sm leading-relaxed text-foreground">{msg.text}</p>
                </div>
              </div>
            ) : (
              /* 사용자 메시지 — 오른쪽 */
              <div key={msg.id} className="mb-3 flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-[var(--brand-primary)] px-3.5 py-2.5">
                  <p className="text-sm leading-relaxed text-white">{msg.text}</p>
                </div>
              </div>
            ),
          )}

          {/* 입력 중 표시 */}
          {isTyping && (
            <div className="mb-3 flex items-end gap-2">
              <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-border/40">
                <Image src={resolved.avatarUrl} alt="" fill className={cn(GUARDIAN_AVATAR_COVER_CLASS)} sizes="28px" />
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
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm transition-colors hover:border-[var(--brand-primary)]/50 hover:bg-[var(--brand-primary)]/5"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── 입력 바 ── */}
        <div className="shrink-0 border-t border-border/50 bg-card px-3 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                /* 자동 높이 조절 */
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="메시지 입력… (Enter 전송, Shift+Enter 줄바꿈)"
              rows={1}
              maxLength={500}
              className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[var(--brand-primary)]/60 focus:outline-none focus:ring-0"
              style={{ minHeight: "42px" }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              aria-label="전송"
              className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-sm transition-opacity disabled:opacity-40"
            >
              <Send className="size-4" aria-hidden />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            시간이 필요한 맞춤 의뢰는 <span className="font-medium text-foreground">요청하기</span>를 이용하세요
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
