"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

/**
 * Footer-only: reads as a real switch (not a lone icon) on dark surfaces.
 */
export function FooterThemeSwitch({ className }: { className?: string }) {
  const t = useTranslations("Header");
  const tFooter = useTranslations("Footer");
  const { resolved, mounted, toggleTheme } = useTheme();
  const dark = resolved === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      disabled={!mounted}
      aria-label={dark ? t("themeSwitchToLight") : t("themeSwitchToDark")}
      onClick={toggleTheme}
      className={cn(
        "inline-flex h-10 min-h-10 shrink-0 items-center gap-0.5 rounded-[var(--radius-md)] border border-white/20 bg-white/10 p-0.5 backdrop-blur-sm",
        "outline-none transition-[box-shadow,background-color,opacity] duration-200",
        "hover:bg-white/12",
        "focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        "disabled:opacity-60",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-2 leading-none",
          "transition-[box-shadow,background-color,opacity] duration-200",
          dark ? "opacity-80" : "bg-white shadow-sm ring-2 ring-white/50",
        )}
      >
        <Sun className="size-[1.05rem]" strokeWidth={2.35} aria-hidden />
        <span className={cn("text-[11px] font-semibold tracking-wide", !dark ? "underline underline-offset-4 text-[#0b1020]" : "opacity-80")}>
          LIGHT
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          "flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-2 leading-none",
          "transition-[box-shadow,background-color,opacity] duration-200",
          dark ? "bg-white shadow-sm ring-2 ring-white/50" : "opacity-80",
        )}
      >
        <Moon className="size-[1.05rem]" strokeWidth={2.35} aria-hidden />
        <span className={cn("text-[11px] font-semibold tracking-wide", dark ? "underline underline-offset-4 text-[#0b1020]" : "opacity-80")}>
          DARK
        </span>
      </span>

      <span className="sr-only">{dark ? tFooter("themeDark") : tFooter("themeLight")}</span>
    </button>
  );
}
