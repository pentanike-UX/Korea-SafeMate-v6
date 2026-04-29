"use client";

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

/** Compact language dropdown: [ 한국어 ⌄ ] — dark surface only */
function FooterCompactLang() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="relative inline-flex items-center">
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value })}
        className={cn(
          "appearance-none cursor-pointer",
          "rounded-[var(--radius-sm)] border border-white/14 bg-transparent",
          "py-1 pl-2.5 pr-5 text-[12px] font-medium text-white/52",
          "transition-colors hover:border-white/25 hover:text-white/75",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
        )}
        aria-label="언어 선택"
      >
        {SWITCH_LOCALES.map((code) => (
          <option key={code} value={code} className="bg-[#131a2a] text-white">
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
      {/* custom chevron */}
      <svg
        className="pointer-events-none absolute right-1.5 size-2.5 text-white/40"
        viewBox="0 0 10 6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path d="M1 1l4 4 4-4" />
      </svg>
    </div>
  );
}

/** Compact icon-only theme toggle: Sun (switch to light) / Moon (switch to dark) */
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
        "inline-flex size-7 items-center justify-center rounded-[var(--radius-sm)]",
        "border border-white/14 bg-transparent text-white/52",
        "transition-colors hover:border-white/25 hover:text-white/75",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
        "disabled:opacity-40",
      )}
    >
      {dark ? (
        <Sun className="size-3.5" strokeWidth={2} aria-hidden />
      ) : (
        <Moon className="size-3.5" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}

/** Compact lang + theme controls for the footer copyright row */
export function FooterCompactControls({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
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
