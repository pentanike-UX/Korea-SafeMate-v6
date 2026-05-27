"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GuardianRequestOpenTrigger, type GuardianRequestOpenDetail } from "@/components/guardians/guardian-request-sheet";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { confirmRouteCheckoutAction } from "@/lib/route-access-checkout.server";
import { useToast } from "@/components/ui/toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDemoUnlock: () => void;
  guardianOpenDetail: GuardianRequestOpenDetail;
  /** Phase 3C: 결제 완료 시 서버에서 grant/pack 생성을 위해 필요. mock 루트면 생략 가능. */
  routeId?: string;
};

// 결제 시트 단계 — 심플 흐름: plan(월구독·일회성) → method(Toss/Kakao) → processing → success
// 'intro'는 사용하지 않으나(레거시) 타입은 보존 — 시그니처는 외부에서 참조되지 않음.
type Step = "plan" | "method" | "processing" | "success";
type PayMethod = "toss" | "kakao";
type PlanCode = "monthly_9900" | "pass_1" | "pass_3" | "pass_5";

/**
 * 데모: 스팟 상세(실명·갤러리) 잠금 해제 — 4단계 가짜 결제 시뮬레이션
 *   intro → method (토스/카카오 선택) → processing (로딩) → success (자동 unlock)
 * TODO: 실제 결제(인앱/웹) 연동 시 confirm 시점에 PG 호출 + 검증.
 */
export function PlaybookUnlockSheet({
  open,
  onOpenChange,
  onConfirmDemoUnlock,
  guardianOpenDetail,
  routeId,
}: Props) {
  const t = useTranslations("RoutePosts");
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("plan");
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [plan, setPlan] = useState<PlanCode | null>(null);
  const [grantConfirmed, setGrantConfirmed] = useState(false);

  // 시트가 닫히면 단계 초기화 (열면 항상 플랜 선택부터)
  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => {
        setStep("plan");
        setMethod(null);
        setPlan(null);
        setGrantConfirmed(false);
      }, 200);
      return () => clearTimeout(id);
    }
  }, [open]);

  // processing → success → grant 발급 + 토스트
  // Success 시트는 사용자가 명시적으로 닫거나 "전체 코스 보기"를 누를 때까지 유지
  // (공유 CTA를 보고 누를 수 있도록).
  useEffect(() => {
    if (step === "processing") {
      const id = setTimeout(() => setStep("success"), 2500);
      return () => clearTimeout(id);
    }
    if (step === "success" && !grantConfirmed) {
      setGrantConfirmed(true);
      void (async () => {
        // Phase 3C: 결제 완료 시점에 서버측 grant/pack 발급을 시도.
        // routeId가 있을 때만 (mock 루트가 아닐 때) 실제 grant를 만든다.
        if (routeId && plan && plan !== "monthly_9900") {
          try {
            await confirmRouteCheckoutAction({
              routeId,
              plan,
              receiptId: `fake_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            });
            router.refresh();
          } catch {
            /* swallow — 데모는 그대로 진행 */
          }
        }
        // 결제 성공 토스트 — 데모/실 둘 다 노출.
        const priceLabel = plan ? PLAN_PRICE[plan].replace("₩", "").replace(",", "") : "";
        toast({
          variant: "success",
          title: t("paymentSuccessToastTitle", { price: priceLabel }),
          description: t("paymentSuccessToastBody"),
        });
        // 데모 unlock은 즉시 적용해서 뒤에서 콘텐츠가 풀리도록.
        onConfirmDemoUnlock();
      })();
    }
  }, [step, grantConfirmed, onConfirmDemoUnlock, routeId, plan, router, toast, t]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[min(94dvh,38rem)] p-0">
        {step === "plan" ? (
          <PlanStep
            t={t}
            guardianOpenDetail={guardianOpenDetail}
            onSelect={(p) => {
              setPlan(p);
              setStep("method");
            }}
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
          <SuccessStep
            t={t}
            plan={plan}
            onClose={() => onOpenChange(false)}
            onShare={() => {
              onOpenChange(false);
              // Cockpit 좌측 공유 패널이 자동 노출되도록 router.refresh로 access reason→owner 갱신.
              router.refresh();
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Step 1: 플랜 선택 (월 구독 / 일회성 1·3·5회) — 심플 단일 화면 ──────────
const PLAN_PRICE: Record<PlanCode, string> = {
  monthly_9900: "₩9,900",
  pass_1: "₩990",
  pass_3: "₩2,500",
  pass_5: "₩3,600",
};

function PlanStep({
  t,
  onSelect,
  guardianOpenDetail,
}: {
  t: (k: string) => string;
  onSelect: (p: PlanCode) => void;
  guardianOpenDetail: GuardianRequestOpenDetail;
}) {
  return (
    <>
      <SheetHeader className="px-5 sm:px-6">
        <SheetTitle>{t("planSheetTitle")}</SheetTitle>
        <SheetDescription className="text-left">{t("planSheetLead")}</SheetDescription>
      </SheetHeader>

      <div className="px-5 sm:px-6 pb-3 space-y-2.5">
        {/* 월 구독 (추천) */}
        <button
          type="button"
          onClick={() => onSelect("monthly_9900")}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-primary/60 bg-primary/5 px-4 py-3.5 text-left transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[15px] font-bold text-foreground">{t("planSubscriptionLabel")}</p>
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-primary-foreground">
                {t("planSubscriptionBadge")}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("planSubscriptionDesc")}</p>
          </div>
          <p className="text-[15px] font-extrabold tracking-tight text-foreground shrink-0">
            {t("planSubscriptionPrice")}
          </p>
        </button>

        {/* 일회성 — 3개 콤팩트 리스트 (구분선 하나로) */}
        <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/40">
          <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("planOneTimeSectionLabel")}
          </p>
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
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground">{t(p.label)}</p>
                  {p.badge ? (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {t(p.badge)}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t(p.unit)}</p>
              </div>
              <p className="text-sm font-bold tracking-tight text-foreground shrink-0">{t(p.price)}</p>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground px-1">{t("planFootnote")}</p>
      </div>

      <SheetFooter className="px-5 sm:px-6 pb-5">
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
function SuccessStep({
  t,
  plan,
  onClose,
  onShare,
}: {
  t: (k: string) => string;
  plan: PlanCode | null;
  onClose: () => void;
  onShare: () => void;
}) {
  const priceLabel = plan ? PLAN_PRICE[plan] : t("paywallCtaPrimaryPrice");
  // 시연용 가짜 영수증 번호 — 매 진입마다 새로 생성 (실 PG 연동 시 콜백 값으로 교체).
  const [receiptNo] = useState(
    () => `R-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  );
  return (
    <div className="flex flex-col items-center px-6 py-10 min-h-[26rem] text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
        <Check className="size-8" strokeWidth={3} />
      </div>
      <p className="text-xl font-bold text-foreground">{t("paymentSuccessTitle")}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t("paymentSuccessLead")}</p>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">{priceLabel}</p>
      <p className="mt-2 text-[11px] text-muted-foreground tabular-nums">
        {t("paymentSuccessReceiptLabel")} · {receiptNo}
      </p>

      <div className="mt-7 w-full space-y-2.5">
        <Button
          type="button"
          onClick={onClose}
          className="h-11 w-full rounded-2xl text-sm font-bold"
        >
          {t("paymentSuccessUnlockCta")}
        </Button>
        {plan !== "monthly_9900" ? (
          <button
            type="button"
            onClick={onShare}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
          >
            <Users className="size-4 text-[var(--brand-primary)]" aria-hidden />
            {t("paymentSuccessShareCta")}
          </button>
        ) : null}
        {plan !== "monthly_9900" ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {t("paymentSuccessShareHint")}
          </p>
        ) : null}
      </div>
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
