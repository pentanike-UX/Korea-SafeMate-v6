"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { TextActionSecondary } from "@/components/ui/text-action";

export function ExploreCtas() {
  const t = useTranslations("Explore");

  return (
    <section className="border-y border-border/60 bg-gradient-to-r from-[var(--brand-primary-soft)]/35 via-[var(--brand-trust-blue-soft)]/25 to-[var(--brand-primary-soft)]/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-foreground text-sm font-medium">{t("ctaTitle")}</p>
          <p className="text-muted-foreground mt-1 max-w-lg text-sm leading-relaxed">{t("ctaLead")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:shrink-0 sm:gap-3">
          <Button asChild className="rounded-xl">
            <Link href="/book">{t("bookSupport")}</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/guardians/apply">{t("becomeGuardian")}</Link>
          </Button>
          <TextActionSecondary href="/guardians" className="sm:pl-1">
            {t("guardianProfiles")}
          </TextActionSecondary>
        </div>
      </div>
    </section>
  );
}
