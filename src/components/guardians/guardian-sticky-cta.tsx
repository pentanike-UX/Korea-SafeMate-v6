"use client";

import { useTranslations } from "next-intl";
import {
  GuardianInquiryOpenTrigger,
  type GuardianInquiryOpenDetail,
} from "@/components/guardians/guardian-inquiry-sheet";
import { GuardianRequestOpenTrigger } from "@/components/guardians/guardian-request-sheet";
import { cn } from "@/lib/utils";

export function GuardianStickyCta({ inquiryDetail }: { inquiryDetail: GuardianInquiryOpenDetail }) {
  const t = useTranslations("GuardianRequest");
  return (
    <div className="border-border/80 bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg flex-col gap-2">
        <GuardianInquiryOpenTrigger
          detail={inquiryDetail}
          className={cn(
            "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/50 bg-emerald-50 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100",
            "dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50",
          )}
        >
          {t("inquiryQuickCta")}
        </GuardianInquiryOpenTrigger>
        <GuardianRequestOpenTrigger className="h-12 w-full rounded-2xl text-base font-semibold shadow-[var(--shadow-brand)]">
          {t("openCta")}
        </GuardianRequestOpenTrigger>
      </div>
    </div>
  );
}
