"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GuardianRequestOpenTrigger, type GuardianRequestOpenDetail } from "@/components/guardians/guardian-request-sheet";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDemoUnlock: () => void;
  guardianOpenDetail: GuardianRequestOpenDetail;
};

type Step = "intro" | "method" | "processing" | "success";
type PayMethod = "toss" | "kakao";

/**
 * 데모: 스팟 상세(실명·갤러리) 잠금 해제 — 4단계 가짜 결제 시뮬레이션
 *   intro → method (토스/카카오 선택) → processing (로딩) → success (자동 unlock)
 * TODO: 실제 결제(인앱/웹) 연동 시 confirm 시점에 PG 호출 + 검증.
 */
export function PlaybookUnlockSheet({ open, onOpenChange, onConfirmDemoUnlock, guardianOpenDetail }: Props) {
  const t = useTranslations("RoutePosts");
  const [step, setStep] = useState<Step>("intro");
  const [method, setMethod] = useState<PayMethod | null>(null);

  // 시트가 닫히면 단계 초기화
  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => {
        setStep("intro");
        setMethod(null);
      }, 200);
      return () => clearTimeout(id);
    }
  }, [open]);

  // processing → success → 자동 unlock + close
  // 데모 임팩트 강화: 결제 진행/완료 화면이 시연자에게 충분히 보이도록 약간의 지연.
  useEffect(() => {
    if (step === "processing") {
      const id = setTimeout(() => setStep("success"), 2500);
      return () => clearTimeout(id);
    }
    if (step === "success") {
      const id = setTimeout(() => {
        onConfirmDemoUnlock();
        onOpenChange(false);
      }, 2000);
      return () => clearTimeout(id);
    }
  }, [step, onConfirmDemoUnlock, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[min(94dvh,38rem)] p-0">
        {step === "intro" ? (
          <IntroStep
            t={t}
            onPay={() => setStep("method")}
            guardianOpenDetail={guardianOpenDetail}
          />
        ) : step === "method" ? (
          <MethodStep
            t={t}
            onSelect={(m) => {
              setMethod(m);
              setStep("processing");
            }}
            onBack={() => setStep("intro")}
          />
        ) : step === "processing" ? (
          <ProcessingStep t={t} method={method ?? "toss"} />
        ) : (
          <SuccessStep t={t} />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Step 1: 혜택 안내 ────────────────────────────────────────────────────────
function IntroStep({
  t,
  onPay,
  guardianOpenDetail,
}: {
  t: (k: string) => string;
  onPay: () => void;
  guardianOpenDetail: GuardianRequestOpenDetail;
}) {
  return (
    <>
      <SheetHeader className="px-5 sm:px-6">
        <SheetTitle>{t("unlockSheetTitle")}</SheetTitle>
        <SheetDescription className="text-left">{t("unlockSheetDescription")}</SheetDescription>
      </SheetHeader>
      <div className="px-5 sm:px-6 pb-2">
        <ul className="text-muted-foreground space-y-1.5 text-sm">
          {([t("paywallItem1"), t("paywallItem2"), t("paywallItem3"), t("paywallItem4"), t("paywallItem5")] as string[]).map(
            (item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary font-bold">✓</span>
                {item}
              </li>
            ),
          )}
        </ul>
      </div>
      <SheetFooter className="gap-2 sm:flex-col px-5 sm:px-6 pb-5">
        <Button type="button" className="w-full rounded-xl" onClick={onPay}>
          {t("unlockSheetPayCta")} · {t("paywallCtaPrimaryPrice")}
        </Button>
        <GuardianRequestOpenTrigger
          variant="ghost"
          size="sm"
          className="text-muted-foreground w-full"
          openDetail={guardianOpenDetail}
        >
          {t("paywallCtaSecondary")}
        </GuardianRequestOpenTrigger>
      </SheetFooter>
    </>
  );
}

// ── Step 2: 결제 수단 선택 ───────────────────────────────────────────────────
function MethodStep({
  t,
  onSelect,
  onBack,
}: {
  t: (k: string) => string;
  onSelect: (m: PayMethod) => void;
  onBack: () => void;
}) {
  return (
    <>
      <SheetHeader className="px-5 sm:px-6">
        <div className="flex items-center gap-2">
          <SheetTitle>{t("paymentMethodTitle")}</SheetTitle>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            {t("paymentDemoBadge")}
          </span>
        </div>
        <SheetDescription className="text-left">{t("paymentMethodLead")}</SheetDescription>
      </SheetHeader>

      <div className="px-5 sm:px-6 pb-4 space-y-2.5">
        {/* 토스페이 */}
        <button
          type="button"
          onClick={() => onSelect("toss")}
          className="group relative flex w-full items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:border-[#3182F6] hover:bg-[#3182F6]/5 hover:shadow-md"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#3182F6] text-white shadow-sm">
            <TossMark />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground">{t("paymentMethodToss")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("paymentMethodTossDesc")}</p>
          </div>
          <span className="text-xs font-semibold text-[#3182F6] opacity-0 group-hover:opacity-100 transition-opacity">
            →
          </span>
        </button>

        {/* 카카오페이 */}
        <button
          type="button"
          onClick={() => onSelect("kakao")}
          className="group relative flex w-full items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:border-[#FFEB00] hover:bg-[#FFEB00]/10 hover:shadow-md"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#FFEB00] text-[#3C1E1E] shadow-sm">
            <KakaoMark />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground">{t("paymentMethodKakao")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("paymentMethodKakaoDesc")}</p>
          </div>
          <span className="text-xs font-semibold text-[#FFA500] opacity-0 group-hover:opacity-100 transition-opacity">
            →
          </span>
        </button>
      </div>

      <SheetFooter className="px-5 sm:px-6 pb-5">
        <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onBack}>
          ← {t("paymentMethodBackCta")}
        </Button>
      </SheetFooter>
    </>
  );
}

// ── Step 3: 결제 진행 중 (가짜 PG 화면) ──────────────────────────────────────
function ProcessingStep({ t, method }: { t: (k: string) => string; method: PayMethod }) {
  const isToss = method === "toss";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 min-h-[26rem] text-center",
        isToss ? "bg-[#3182F6]" : "bg-[#FFEB00]",
      )}
    >
      {/* 결제 마크 */}
      <div
        className={cn(
          "mb-6 flex size-16 items-center justify-center rounded-2xl shadow-lg",
          isToss ? "bg-white text-[#3182F6]" : "bg-[#FFEB00] text-[#3C1E1E] ring-4 ring-[#3C1E1E]/10",
        )}
      >
        {isToss ? <TossMark large /> : <KakaoMark large />}
      </div>

      <p className={cn("text-base font-semibold", isToss ? "text-white" : "text-[#3C1E1E]")}>
        {isToss ? t("paymentMethodToss") : t("paymentMethodKakao")}
      </p>

      <p className={cn("mt-2 text-2xl font-bold tracking-tight", isToss ? "text-white" : "text-[#3C1E1E]")}>
        {t("paymentTossOrderName")}
      </p>

      <p className={cn("mt-1 text-3xl font-extrabold tracking-tighter", isToss ? "text-white" : "text-[#3C1E1E]")}>
        {t("paywallCtaPrimaryPrice")}
      </p>

      <div className="mt-10 flex items-center gap-3">
        <Loader2 className={cn("size-5 animate-spin", isToss ? "text-white" : "text-[#3C1E1E]")} />
        <p className={cn("text-sm font-medium", isToss ? "text-white/90" : "text-[#3C1E1E]/80")}>
          {t("paymentProcessingTitle")}
        </p>
      </div>
      <p className={cn("mt-1 text-xs", isToss ? "text-white/70" : "text-[#3C1E1E]/60")}>
        {isToss ? t("paymentProcessingTossLead") : t("paymentProcessingKakaoLead")}
      </p>

      <span
        className={cn(
          "mt-8 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider",
          isToss ? "bg-white/15 text-white/80" : "bg-[#3C1E1E]/10 text-[#3C1E1E]/70",
        )}
      >
        {t("paymentDemoBadge")}
      </span>
    </div>
  );
}

// ── Step 4: 결제 완료 ────────────────────────────────────────────────────────
function SuccessStep({ t }: { t: (k: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 min-h-[26rem] text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
        <Check className="size-8" strokeWidth={3} />
      </div>
      <p className="text-xl font-bold text-foreground">{t("paymentSuccessTitle")}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t("paymentSuccessLead")}</p>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">
        {t("paywallCtaPrimaryPrice")}
      </p>
    </div>
  );
}

// ── 결제사 로고 (인라인 SVG, 라이선스 회피용 단순 마크) ──────────────────────
function TossMark({ large }: { large?: boolean } = {}) {
  const size = large ? 28 : 18;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5c-.6 0-1.1.5-1.1 1.1v8.2L7.6 8.5a1.1 1.1 0 10-1.6 1.6l5.2 5.2c.4.4 1.2.4 1.6 0l5.2-5.2a1.1 1.1 0 10-1.6-1.6l-3.3 3.3V3.6c0-.6-.5-1.1-1.1-1.1zM4 19.4c0-.6.5-1.1 1.1-1.1h13.8a1.1 1.1 0 110 2.2H5.1c-.6 0-1.1-.5-1.1-1.1z"
        fill="currentColor"
      />
    </svg>
  );
}

function KakaoMark({ large }: { large?: boolean } = {}) {
  const size = large ? 28 : 18;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <text x="12" y="17" textAnchor="middle" fontSize="11" fontWeight="900" fill="currentColor" fontFamily="Inter, sans-serif">
        Pay
      </text>
    </svg>
  );
}
