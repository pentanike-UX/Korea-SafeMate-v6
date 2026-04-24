"use client";

import { useTranslations } from "next-intl";
import { GuardianRequestOpenTrigger } from "@/components/guardians/guardian-request-sheet";

export function GuardianStickyCta() {
  const t = useTranslations("GuardianRequest");
  return (
    <div className="border-border/80 bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
      <GuardianRequestOpenTrigger className="h-12 w-full rounded-2xl text-base font-semibold shadow-[var(--shadow-brand)]">
        {t("openCta")}
      </GuardianRequestOpenTrigger>
    </div>
  );
}
