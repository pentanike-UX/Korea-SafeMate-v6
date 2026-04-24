"use client";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { FooterThemeSwitch } from "@/components/layout/footer-theme-switch";
import { cn } from "@/lib/utils";

export function FooterPreferences({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 sm:gap-2.5", className)}>
      <LanguageSwitcher className="w-fit shrink-0" variant="onDark" />
      <FooterThemeSwitch />
    </div>
  );
}
