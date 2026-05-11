"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FALLBACK_GUARDIAN_REQUEST_AVATAR, GUARDIAN_REQUEST_DEFAULTS_EVENT } from "@/components/guardians/guardian-request-sheet";
import { GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { cn } from "@/lib/utils";
import { CheckCircle2, MessageCircle } from "lucide-react";

export const GUARDIAN_INQUIRY_OPEN_EVENT = "safemate:open-guardian-inquiry";

export type GuardianInquiryOpenDetail = {
  guardianUserId?: string;
  displayName?: string;
  avatarUrl?: string;
  headline?: string;
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
      new CustomEvent<GuardianInquiryOpenDetail>(GUARDIAN_INQUIRY_OPEN_EVENT, { detail: detail ?? {} }),
    );
  }, [detail]);

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children ?? "문의하기"}
    </button>
  );
}

/** public-site-shell.tsx에 한 번만 마운트 — 이벤트를 받아 문의 시트를 렌더 */
export function GuardianInquirySheetGlobal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<GuardianInquiryOpenDetail>({});
  const [defaults, setDefaults] = useState<GuardianInquiryOpenDetail>({});
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* 페이지 레벨에서 발행된 가디언 기본값(이름·아바타 등) 수신 */
  useEffect(() => {
    const onDefaults = (e: Event) => {
      const d = (e as CustomEvent).detail ?? {};
      setDefaults(d);
    };
    window.addEventListener(GUARDIAN_REQUEST_DEFAULTS_EVENT, onDefaults);
    return () => window.removeEventListener(GUARDIAN_REQUEST_DEFAULTS_EVENT, onDefaults);
  }, []);

  /* 문의 시트 열기 이벤트 수신 */
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d: GuardianInquiryOpenDetail = (e as CustomEvent<GuardianInquiryOpenDetail>).detail ?? {};
      setDetail(d);
      setSent(false);
      setMessage("");
      setOpen(true);
    };
    window.addEventListener(GUARDIAN_INQUIRY_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(GUARDIAN_INQUIRY_OPEN_EVENT, onOpen);
  }, []);

  /* 시트 열릴 때 textarea 포커스 */
  useEffect(() => {
    if (open && !sent) {
      const id = setTimeout(() => textareaRef.current?.focus(), 120);
      return () => clearTimeout(id);
    }
  }, [open, sent]);

  const resolved = {
    displayName: detail.displayName ?? defaults.displayName ?? "하루이",
    avatarUrl: detail.avatarUrl ?? defaults.avatarUrl ?? FALLBACK_GUARDIAN_REQUEST_AVATAR,
    headline: detail.headline ?? defaults.headline ?? "현지 전문 하루이",
  };

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    /* TODO: 실제 전송 API 연결 */
    setSent(true);
  }, [message]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[420px]"
        aria-label="하루이에게 문의"
      >
        <SheetHeader className="border-b border-border/50 px-5 py-4">
          <SheetTitle className="text-base font-semibold">하루이에게 문의</SheetTitle>
        </SheetHeader>

        {/* 가디언 아이덴티티 */}
        <div className="flex items-center gap-3.5 px-5 py-4">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-border/50 shadow-sm">
            <Image src={resolved.avatarUrl} alt={resolved.displayName} fill className={cn(GUARDIAN_AVATAR_COVER_CLASS)} sizes="48px" />
            {/* 온라인 상태 점 */}
            <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-white bg-emerald-500" aria-label="온라인" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{resolved.displayName}</p>
            <p className="flex items-center gap-1 text-[11px] text-emerald-600">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              지금 온라인
            </p>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{resolved.headline}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 px-5 pb-6">
          {sent ? (
            /* ── 전송 완료 상태 ── */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <CheckCircle2 className="size-12 text-emerald-500" aria-hidden />
              <div className="space-y-1.5">
                <p className="text-base font-semibold text-foreground">문의가 전달됐어요!</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {resolved.displayName}이(가) 빠르게 답변할 거예요.
                  <br />
                  보통 1–2시간 내 응답합니다.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-2 rounded-xl"
                onClick={() => {
                  setMessage("");
                  setSent(false);
                }}
              >
                추가 문의하기
              </Button>
            </div>
          ) : (
            /* ── 입력 상태 ── */
            <>
              <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  💬 이런 내용을 보내보세요
                </p>
                <ul className="space-y-0.5 text-[12px] text-muted-foreground">
                  <li>· 이 루트 동행 가능한지 확인하고 싶어요</li>
                  <li>· 3월 둘째 주에 일정 조율 가능한가요?</li>
                  <li>· 알레르기 있는데 식당 추천 도움받을 수 있나요?</li>
                </ul>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <label htmlFor="inquiry-message" className="text-sm font-medium text-foreground">
                  메시지
                </label>
                <Textarea
                  id="inquiry-message"
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="궁금한 점을 1–2문장으로 간단히 남겨주세요."
                  className="min-h-[120px] resize-none rounded-xl text-sm"
                  maxLength={300}
                />
                <p className="text-right text-[11px] text-muted-foreground">{message.length} / 300</p>
              </div>

              <Button
                onClick={handleSend}
                disabled={!message.trim()}
                className="h-11 w-full rounded-xl font-semibold"
              >
                <MessageCircle className="mr-2 size-4" aria-hidden />
                바로 보내기
              </Button>

              <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
                문의는 하루이에게 직접 전달됩니다.
                <br />
                시간이 걸리는 맞춤 의뢰는{" "}
                <span className="font-medium text-foreground">요청하기</span>를 이용하세요.
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
