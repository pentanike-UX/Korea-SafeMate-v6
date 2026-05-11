"use client";

import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { GuardianRequestOpenTrigger } from "@/components/guardians/guardian-request-sheet";
import { GuardianInquiryOpenTrigger } from "@/components/guardians/guardian-inquiry-sheet";

export function GuardianStickyCta() {
  const t = useTranslations("GuardianRequest");
  return (
    <div className="border-border/80 bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
      <div className="grid grid-cols-2 gap-2">
        <GuardianInquiryOpenTrigger className="inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-emerald-500/50 bg-emerald-50 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50">
          <MessageCircle className="size-4" aria-hidden />
          지금 문의하기
        </GuardianInquiryOpenTrigger>
        <GuardianRequestOpenTrigger className="h-12 rounded-2xl text-sm font-semibold shadow-[var(--shadow-brand)]">
          {t("openCta")}
        </GuardianRequestOpenTrigger>
      </div>
    </div>
  );
}
