"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTheme } from "@/components/theme/theme-provider";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { FooterThemeSwitch } from "@/components/layout/footer-theme-switch";

// Full locale names (no flags)
const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  ko: "한국어",
  th: "ไทย",
  vi: "Tiếng Việt",
  ja: "日本語",
};
const SWITCH_LOCALES = ["en", "ko", "th", "vi", "ja"] as const;

/**
 * Custom pill-style language dropdown.
 * Opens upward (bottom-full) to avoid overflow in footer.
 * Closes on outside click or Escape.
 */
function FooterCompactLang() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      {/* Trigger */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
          "transition-all duration-150",
          open
            ? "border-white/28 bg-white/10 text-white/80"
            : "border-white/16 bg-white/[0.04] text-white/48 hover:border-white/26 hover:bg-white/8 hover:text-white/72",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
        )}
      >
        <span>{LOCALE_NAMES[locale] ?? locale}</span>
        <svg
          className={cn("size-2.5 shrink-0 transition-transform duration-150", open && "rotate-180")}
          viewBox="0 0 10 6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      {/* Dropdown panel — opens upward */}
      {open && (
        <div
          role="listbox"
          aria-label="언어 선택"
          className={cn(
            "absolute bottom-full right-0 mb-2 z-50",
            "min-w-[7.5rem] overflow-hidden",
            "rounded-[var(--radius-md)] border border-white/14",
            "bg-[#1c2540]/95 shadow-[0_4px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl",
          )}
        >
          {SWITCH_LOCALES.map((code) => (
            <button
              key={code}
              role="option"
              aria-selected={locale === code}
              type="button"
              onClick={() => {
                router.replace(pathname, { locale: code });
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors duration-100",
                locale === code
                  ? "font-semibold text-white bg-white/10"
                  : "font-medium text-white/52 hover:bg-white/7 hover:text-white/80",
              )}
            >
              {locale === code && (
                <span className="size-1.5 shrink-0 rounded-full bg-accent-ksm" aria-hidden />
              )}
              <span className={locale !== code ? "pl-3.5" : ""}>{LOCALE_NAMES[code]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Icon-only theme toggle.
 * Shows current state icon; on hover, fades in the opposite icon as preview.
 */
function FooterCompactTheme() {
  const { resolved, mounted, toggleTheme } = useTheme();
  const dark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!mounted}
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className={cn(
        "group relative inline-flex size-7 shrink-0 items-center justify-center rounded-full",
        "border border-white/16 bg-white/[0.04] text-white/48",
        "transition-all duration-150 hover:border-white/26 hover:bg-white/8 hover:text-white/72",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
        "disabled:opacity-40",
      )}
    >
      {/* Current state icon — fades out on hover */}
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-200 group-hover:opacity-0 group-hover:scale-75"
        aria-hidden
      >
        {dark ? (
          <Moon className="size-3.5" strokeWidth={1.75} />
        ) : (
          <Sun className="size-3.5" strokeWidth={1.75} />
        )}
      </span>
      {/* Hover preview — opposite icon fades in */}
      <span
        className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100"
        aria-hidden
      >
        {dark ? (
          <Sun className="size-3.5" strokeWidth={1.75} />
        ) : (
          <Moon className="size-3.5" strokeWidth={1.75} />
        )}
      </span>
    </button>
  );
}

/** Compact lang + theme row for the footer copyright area */
export function FooterCompactControls({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <FooterCompactLang />
      <FooterCompactTheme />
    </div>
  );
}

/** @deprecated — keep for backward compat; prefer FooterCompactControls */
export function FooterPreferences({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 sm:gap-2.5", className)}>
      <LanguageSwitcher className="w-fit shrink-0" variant="onDark" />
      <FooterThemeSwitch />
    </div>
  );
}
