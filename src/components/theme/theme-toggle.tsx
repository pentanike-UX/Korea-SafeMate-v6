"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

type Props = {
  /** Header on home hero: light icon treatment */
  variant?: "default" | "onDarkSurface";
  className?: string;
};

export function ThemeToggle({ variant = "default", className }: Props) {
  const t = useTranslations("Header");
  const { resolved, mounted, toggleTheme } = useTheme();
  const onDark = variant === "onDarkSurface";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      className={cn(
        "shrink-0 rounded-xl transition-colors duration-200",
        onDark
          ? "text-white/90 hover:bg-white/12 hover:text-white"
          : "text-[var(--text-strong)]/85 hover:bg-muted hover:text-[var(--text-strong)]",
        className,
      )}
      aria-label={resolved === "dark" ? t("themeSwitchToLight") : t("themeSwitchToDark")}
      onClick={toggleTheme}
    >
      {mounted ? (
        resolved === "dark" ? (
          <Sun className="size-[18px]" strokeWidth={1.75} aria-hidden />
        ) : (
          <Moon className="size-[18px]" strokeWidth={1.75} aria-hidden />
        )
      ) : (
        <Moon className="size-[18px] opacity-50" strokeWidth={1.75} aria-hidden />
      )}
    </Button>
  );
}
