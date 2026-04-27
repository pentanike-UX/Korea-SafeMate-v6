"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// v6: en / ko / th / vi (ja 유지 — Foundation 갭 기록)
const SWITCH_LOCALES = ["en", "ko", "th", "vi", "ja"] as const;

type LocaleCode = (typeof SWITCH_LOCALES)[number];

/** 국기 이모지 — regional indicator emoji pairs */
const LOCALE_FLAGS: Record<LocaleCode, string> = {
  en: "\u{1F1FA}\u{1F1F8}", // 🇺🇸
  ko: "\u{1F1F0}\u{1F1F7}", // 🇰🇷
  th: "\u{1F1F9}\u{1F1ED}", // 🇹🇭
  vi: "\u{1F1FB}\u{1F1F3}", // 🇻🇳
  ja: "\u{1F1EF}\u{1F1F5}", // 🇯🇵
};

const LOCALE_LABELS: Record<LocaleCode, string> = {
  en: "EN",
  ko: "KO",
  th: "TH",
  vi: "VI",
  ja: "JA",
};

const FLAG_ARIA_KEY: Record<LocaleCode, "flagAriaEn" | "flagAriaKo" | "flagAriaJa" | "flagAriaTh" | "flagAriaVi"> = {
  en: "flagAriaEn",
  ko: "flagAriaKo",
  th: "flagAriaTh",
  vi: "flagAriaVi",
  ja: "flagAriaJa",
};

export function LanguageSwitcher({
  className,
  variant = "default",
}: {
  className?: string;
  /** @deprecated Header no longer uses the switcher; both map to the same footer-oriented style. */
  variant?: "default" | "onDark";
}) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const onDark = variant === "onDark";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[var(--radius-md)] border",
        onDark ? "h-10 min-h-10 gap-0.5 p-0.5" : "gap-0.5 p-0.5 sm:gap-1 sm:p-1",
        onDark
          ? "border-white/20 bg-white/10 backdrop-blur-sm"
          : "border-border/70 bg-[color-mix(in_srgb,var(--brand-primary-soft)_35%,var(--muted))]",
        className,
      )}
      role="toolbar"
      aria-label={t("label")}
    >
      {SWITCH_LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => router.replace(pathname, { locale: code })}
          aria-pressed={locale === code}
          aria-label={t(FLAG_ARIA_KEY[code])}
          title={t(FLAG_ARIA_KEY[code])}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-2 leading-none transition-[box-shadow,background-color,opacity] duration-200",
            onDark ? "h-9 min-h-9 text-[1.1rem]" : "h-10 text-[1.15rem] sm:h-11 sm:text-[1.2rem]",
            locale === code
              ? onDark
                ? "bg-white shadow-sm ring-2 ring-white/50"
                : "bg-background shadow-sm ring-2 ring-[var(--brand-primary)] ring-offset-1 ring-offset-[color-mix(in_srgb,var(--brand-primary-soft)_35%,var(--muted))]"
              : onDark
                ? "opacity-80 hover:bg-white/15 hover:opacity-100"
                : "opacity-70 hover:bg-background/90 hover:opacity-100",
          )}
        >
          <span aria-hidden className="select-none">
            {LOCALE_FLAGS[code]}
          </span>
          <span
            aria-hidden
            className={cn(
              "text-[11px] font-semibold tracking-wide",
              locale === code ? "underline underline-offset-4" : "opacity-80",
              onDark && locale === code ? "text-[#0b1020]" : undefined,
            )}
          >
            {LOCALE_LABELS[code]}
          </span>
        </button>
      ))}
    </div>
  );
}
