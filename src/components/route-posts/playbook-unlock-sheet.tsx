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

type Step = "intro" | "plan" | "method" | "processing" | "success";
type PayMethod = "toss" | "kakao";
type PlanCode = "monthly_9900" | "pass_1" | "pass_3" | "pass_5";

/**
 * 데모: 스팟 상세(실명·갤러리) 잠금 해제 — 4단계 가짜 결제 시뮬레이션
 *   intro → method (토스/카카오 선택) → processing (로딩) → success (자동 unlock)
 * TODO: 실제 결제(인앱/웹) 연동 시 confirm 시점에 PG 호출 + 검증.
 */
export function PlaybookUnlockSheet({ open, onOpenChange, onConfirmDemoUnlock, guardianOpenDetail }: Props) {
  const t = useTranslations("RoutePosts");
  const [step, setStep] = useState<Step>("intro");
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [plan, setPlan] = useState<PlanCode | null>(null);

  // 시트가 닫히면 단계 초기화
  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => {
        setStep("intro");
        setMethod(null);
        setPlan(null);
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
            onPay={() => setStep("plan")}
            guardianOpenDetail={guardianOpenDetail}
          />
        ) : step === "plan" ? (
          <PlanStep
            t={t}
            onSelect={(p) => {
              setPlan(p);
              setStep("method");
            }}
            onBack={() => setStep("intro")}
          />
        ) : step === "method" ? (
          <MethodStep
            t={t}
            plan={plan}
            onSelect={(m) => {
              setMethod(m);
              setStep("processing");
            }}
            onBack={() => setStep("plan")}
          />
        ) : step === "processing" ? (
          <ProcessingStep t={t} method={method ?? "toss"} plan={plan} />
        ) : (
          <SuccessStep t={t} plan={plan} />
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

// ── Step 1.5: 플랜 선택 (월 구독 / 일회성 1·3·5회) ───────────────────────────
const PLAN_PRICE: Record<PlanCode, string> = {
  monthly_9900: "₩9,900",
  pass_1: "₩990",
  pass_3: "₩2,500",
  pass_5: "₩3,600",
};

function PlanStep({
  t,
  onSelect,
  onBack,
}: {
  t: (k: string) => string;
  onSelect: (p: PlanCode) => void;
  onBack: () => void;
}) {
  return (
    <>
      <SheetHeader className="px-5 sm:px-6">
        <SheetTitle>{t("planSheetTitle")}</SheetTitle>
        <SheetDescription className="text-left">{t("planSheetLead")}</SheetDescription>
      </SheetHeader>

      <div className="px-5 sm:px-6 pb-4 space-y-3 overflow-y-auto">
        {/* 월 구독 */}
        <button
          type="button"
          onClick={() => onSelect("monthly_9900")}
          className="group relative flex w-full items-center gap-4 rounded-2xl border-2 border-primary/50 bg-primary/5 p-4 text-left transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-foreground">{t("planSubscriptionLabel")}</p>
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary-foreground">
                {t("planSubscriptionBadge")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{t("planSubscriptionDesc")}</p>
          </div>
          <p className="text-base font-extrabold tracking-tight text-foreground shrink-0">
            {t("planSubscriptionPrice")}
          </p>
        </button>

        {/* 일회성 섹션 */}
        <div className="pt-1">
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("planOneTimeSectionLabel")}
          </p>
          <div className="space-y-2">
            {(
              [
                { code: "pass_1", label: "planPass1Label", price: "planPass1Price", unit: "planPass1Unit", badge: null },
                { code: "pass_3", label: "planPass3Label", price: "planPass3Price", unit: "planPass3Unit", badge: null },
                { code: "pass_5", label: "planPass5Label", price: "planPass5Price", unit: "planPass5Unit", badge: "planPass5Badge" },
              ] as const
            ).map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => onSelect(p.code)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:border-foreground/40 hover:bg-muted/50 hover:shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{t(p.label)}</p>
                    {p.badge ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {t(p.badge)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t(p.unit)}</p>
                </div>
                <p className="text-base font-bold tracking-tight text-foreground shrink-0">{t(p.price)}</p>
              </button>
            ))}
          </div>
        </div>

        <p className="pt-1 text-[11px] text-muted-foreground">{t("planFootnote")}</p>
      </div>

      <SheetFooter className="px-5 sm:px-6 pb-5">
        <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onBack}>
          {t("planBackCta")}
        </Button>
      </SheetFooter>
    </>
  );
}

// ── Step 2: 결제 수단 선택 ───────────────────────────────────────────────────
function MethodStep({
  t,
  plan,
  onSelect,
  onBack,
}: {
  t: (k: string) => string;
  plan: PlanCode | null;
  onSelect: (m: PayMethod) => void;
  onBack: () => void;
}) {
  const priceLabel = plan ? PLAN_PRICE[plan] : t("paywallCtaPrimaryPrice");
  return (
    <>
      <SheetHeader className="px-5 sm:px-6">
        <div className="flex items-center gap-2">
          <SheetTitle>{t("paymentMethodTitle")}</SheetTitle>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            {t("paymentDemoBadge")}
          </span>
        </div>
        <SheetDescription className="text-left">
          {t("paymentMethodLead")} · <span className="font-semibold text-foreground">{priceLabel}</span>
        </SheetDescription>
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
function ProcessingStep({ t, method, plan }: { t: (k: string) => string; method: PayMethod; plan: PlanCode | null }) {
  const isToss = method === "toss";
  const priceLabel = plan ? PLAN_PRICE[plan] : t("paywallCtaPrimaryPrice");
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
        {priceLabel}
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
function SuccessStep({ t, plan }: { t: (k: string) => string; plan: PlanCode | null }) {
  const priceLabel = plan ? PLAN_PRICE[plan] : t("paywallCtaPrimaryPrice");
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 min-h-[26rem] text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
        <Check className="size-8" strokeWidth={3} />
      </div>
      <p className="text-xl font-bold text-foreground">{t("paymentSuccessTitle")}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t("paymentSuccessLead")}</p>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">
        {priceLabel}
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
