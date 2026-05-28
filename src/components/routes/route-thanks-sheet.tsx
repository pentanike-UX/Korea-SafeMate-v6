"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  THANKS_AMOUNT_MAX,
  THANKS_AMOUNT_MIN,
  THANKS_AMOUNT_PRESETS,
  THANKS_MESSAGE_PRESETS,
} from "@/lib/feature-flags";
import { computeThanksBreakdown } from "@/lib/thanks-payment-math";
import { submitThanksPaymentAction } from "@/lib/thanks-payment-actions.server";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Step = "amount" | "processing" | "success";

export function RouteThanksSheet({
  open,
  onOpenChange,
  routeId,
  haruiUserId,
  haruiDisplayName,
  routeTitle,
  hasPriorThanks = false,
  onShareAfterSuccess,
  onPaidSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
  haruiUserId: string;
  haruiDisplayName: string;
  routeTitle: string;
  hasPriorThanks?: boolean;
  onShareAfterSuccess?: () => void;
  onPaidSuccess?: () => void;
}) {
  const t = useTranslations("TravelerHub");
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("amount");
  const [selected, setSelected] = useState<number>(3000);
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");
  const [successHarui, setSuccessHarui] = useState(haruiDisplayName);
  const [successAmount, setSuccessAmount] = useState(0);
  const [pending, startTransition] = useTransition();
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => {
        setStep("amount");
        setSelected(3000);
        setCustom("");
        setMessage("");
        submitLockRef.current = false;
      }, 200);
      return () => clearTimeout(id);
    }
  }, [open]);

  const amount = custom.trim() ? Number(custom.replace(/[^\d]/g, "")) : selected;
  const breakdown = Number.isFinite(amount) && amount > 0 ? computeThanksBreakdown(amount) : null;

  function onSubmit() {
    if (submitLockRef.current || pending) {
      toast({ variant: "error", title: t("thanksErrInProgress") });
      return;
    }
    if (!breakdown || breakdown.grossAmount < THANKS_AMOUNT_MIN || breakdown.grossAmount > THANKS_AMOUNT_MAX) {
      toast({ variant: "error", title: t("thanksErrAmount") });
      return;
    }
    submitLockRef.current = true;
    setStep("processing");
    startTransition(async () => {
      const res = await submitThanksPaymentAction({
        routeId,
        haruiUserId,
        amount: breakdown.grossAmount,
        message: message.trim() || null,
        source: "route-detail",
      });
      submitLockRef.current = false;
      if (!res.ok) {
        setStep("amount");
        const msg =
          res.error === "login-required"
            ? t("thanksErrLogin")
            : res.error === "table-missing"
              ? t("thanksErrUnavailable")
              : res.error === "duplicate-payment"
                ? t("thanksErrInProgress")
                : res.error === "own-route"
                  ? t("thanksErrOwnRoute")
                  : res.error === "route-not-public" || res.error === "route-not-found"
                    ? t("thanksErrRouteUnavailable")
                    : t("thanksErrGeneric");
        toast({ variant: "error", title: msg });
        return;
      }
      setSuccessHarui(res.haruiDisplayName);
      setSuccessAmount(res.breakdown.grossAmount);
      setStep("success");
      onPaidSuccess?.();
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next && step === "processing") return;
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="z-[90]"
        className="z-[90] max-h-[92vh] overflow-y-auto rounded-t-3xl px-6 pb-8 pt-6"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{t("thanksSheetTitle")}</SheetTitle>
          <SheetDescription>{t("thanksCtaLead")}</SheetDescription>
        </SheetHeader>

        {step === "amount" ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-foreground font-serif text-xl font-bold">{t("thanksSheetTitle")}</h2>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                {hasPriorThanks ? t("thanksCtaLeadRepeat") : t("thanksCtaLead")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {THANKS_AMOUNT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelected(preset);
                    setCustom("");
                  }}
                  className={cn(
                    "h-11 rounded-xl border text-sm font-bold tabular-nums transition-colors",
                    selected === preset && !custom.trim()
                      ? preset === 5000
                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--text-on-brand)]"
                        : "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                      : "border-border/60 hover:bg-muted/50",
                  )}
                >
                  ₩{preset.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">{t("thanksCustomAmountLabel")}</label>
              <Input
                inputMode="numeric"
                placeholder={t("thanksCustomAmountPlaceholder")}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {THANKS_MESSAGE_PRESETS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMessage(t(key))}
                  className="border-border/60 text-muted-foreground hover:border-[var(--brand-primary)]/40 hover:text-foreground rounded-full border px-3 py-1.5 text-xs transition-colors"
                >
                  {t(key)}
                </button>
              ))}
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("thanksMessagePlaceholder")}
              maxLength={200}
              rows={3}
              className="resize-none rounded-xl"
            />

            {breakdown ? (
              <p className="text-muted-foreground rounded-xl bg-muted/40 px-3 py-2.5 text-xs leading-relaxed whitespace-pre-line">
                {t("thanksFeeNotice", {
                  gross: breakdown.grossAmount.toLocaleString(),
                  harui: breakdown.haruiAmount.toLocaleString(),
                  fee: breakdown.platformFeeAmount.toLocaleString(),
                })}
              </p>
            ) : null}

            <Button
              type="button"
              disabled={pending}
              onClick={onSubmit}
              className="h-11 w-full rounded-xl bg-[var(--brand-primary)] font-semibold text-[var(--text-on-brand)]"
            >
              {t("thanksSubmitCta")}
            </Button>
          </div>
        ) : null}

        {step === "processing" ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="text-muted-foreground size-8 animate-spin" aria-hidden />
            <p className="text-muted-foreground text-sm">{t("thanksProcessing")}</p>
          </div>
        ) : null}

        {step === "success" ? (
          <div className="space-y-5 py-4 text-center">
            <h2 className="text-foreground font-serif text-2xl font-bold">{t("thanksSuccessTitle")}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{t("thanksSuccessBody")}</p>
            <div className="border-border/60 bg-muted/30 rounded-2xl border p-4 text-left text-sm">
              <p className="text-foreground font-semibold">{successHarui}</p>
              <p className="text-muted-foreground mt-1 line-clamp-2">{routeTitle}</p>
              <p className="text-foreground mt-2 font-bold tabular-nums">₩{successAmount.toLocaleString()}</p>
              {message.trim() ? (
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">“{message.trim()}”</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Button type="button" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
                {t("thanksSuccessClose")}
              </Button>
              {onShareAfterSuccess ? (
                <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onShareAfterSuccess}>
                  {t("thanksSuccessShare")}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

      </SheetContent>
    </Sheet>
  );
}
