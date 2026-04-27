"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  nextPath: string;
};

type Step = 1 | 2 | 3;

const SUPPORTED_LANGS = ["th", "vi", "en", "ko"] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const COUNTRY_OPTIONS = ["TH", "VN", "ID", "PH", "MY", "JP", "US", "KR"] as const;
type CountryCode = (typeof COUNTRY_OPTIONS)[number];

export function OnboardingCardClient({ nextPath }: Props) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const safeNext = useMemo(() => safeNextPath(nextPath) ?? "/explore", [nextPath]);

  const [step, setStep] = useState<Step>(1);
  const [preferredLanguage, setPreferredLanguage] = useState<SupportedLang | null>(null);
  const [countryCode, setCountryCode] = useState<CountryCode | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function canProceedFromCurrentStep() {
    if (step === 1) return preferredLanguage !== null;
    if (step === 2) return countryCode !== null;
    return isFirstVisit !== null;
  }

  async function finish(skip = false) {
    setError(null);
    const payload = {
      preferredLanguage: preferredLanguage ?? "en",
      countryCode: countryCode ?? "TH",
      isFirstVisit: isFirstVisit ?? true,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError(skip ? t("onboarding.skipFailed") : t("onboarding.saveFailed"));
        return;
      }

      router.replace(safeNext);
    } catch {
      setError(t("error.network"));
    } finally {
      setLoading(false);
    }
  }

  const indicator = `${step}/3`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {t("onboarding.stepIndicator", { current: step, total: 3 })}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={() => void finish(true)} disabled={loading}>
          {t("onboarding.skip")}
        </Button>
      </div>

      <div className="bg-muted/40 text-muted-foreground rounded-[var(--radius-md)] px-3 py-2 text-xs">{indicator}</div>

      {step === 1 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t("onboarding.step1Title")}</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {SUPPORTED_LANGS.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setPreferredLanguage(lang)}
                className={cn(
                  "rounded-[var(--radius-md)] border px-3 py-3 text-sm font-medium transition-colors",
                  preferredLanguage === lang
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted/70",
                )}
              >
                {t(`onboarding.lang.${lang}`)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t("onboarding.step2Title")}</h2>
          <select
            className="h-11 w-full rounded-[var(--radius-md)] border border-input bg-background px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={countryCode ?? ""}
            onChange={(event) => setCountryCode((event.target.value as CountryCode) || null)}
          >
            <option value="">{t("onboarding.countryPlaceholder")}</option>
            {COUNTRY_OPTIONS.map((code) => (
              <option key={code} value={code}>
                {t(`onboarding.country.${code}`)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t("onboarding.step3Title")}</h2>
          <div className="grid gap-2.5">
            <button
              type="button"
              onClick={() => setIsFirstVisit(true)}
              className={cn(
                "rounded-[var(--radius-md)] border px-4 py-3 text-left text-sm font-medium transition-colors",
                isFirstVisit === true ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-muted/70",
              )}
            >
              {t("onboarding.firstVisit")}
            </button>
            <button
              type="button"
              onClick={() => setIsFirstVisit(false)}
              className={cn(
                "rounded-[var(--radius-md)] border px-4 py-3 text-left text-sm font-medium transition-colors",
                isFirstVisit === false ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-muted/70",
              )}
            >
              {t("onboarding.returningVisit")}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="bg-destructive/10 text-destructive rounded-[var(--radius-md)] px-3 py-2 text-sm">{error}</p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev))}
          disabled={step === 1 || loading}
        >
          {t("onboarding.prev")}
        </Button>

        {step < 3 ? (
          <Button type="button" onClick={() => setStep((prev) => (prev < 3 ? ((prev + 1) as Step) : prev))} disabled={!canProceedFromCurrentStep() || loading}>
            {t("onboarding.next")}
          </Button>
        ) : (
          <Button type="button" onClick={() => void finish(false)} disabled={!canProceedFromCurrentStep() || loading}>
            {loading ? t("common.loading") : t("onboarding.finish")}
          </Button>
        )}
      </div>
    </div>
  );
}
