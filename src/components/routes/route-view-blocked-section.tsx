"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { HaruRoute, AppLocale } from "@/types/haru";
import { Button } from "@/components/ui/button";

type BlockKey = "routeShareErrDeleted" | "routeShareErrNotPublished" | "routeShareErrBlocked";

export function RouteViewBlockedSection({
  route,
  locale,
  messageKey,
}: {
  route: HaruRoute;
  locale: AppLocale;
  messageKey: BlockKey;
}) {
  const t = useTranslations("TravelerHub");
  const title = route.title[locale] ?? route.title.en ?? "Route";

  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest">{t("routeViewKickerRoute")}</p>
        <h2 className="text-foreground mt-1 font-serif text-2xl font-semibold">{title}</h2>
      </div>
      <div className="border-border/60 bg-card flex gap-3 rounded-2xl border p-6 shadow-[var(--shadow-sm)]">
        <AlertCircle className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="space-y-3">
          <p className="text-foreground text-sm font-medium leading-relaxed whitespace-pre-line">{t(messageKey)}</p>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/explore">{t("ctaExplore")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
