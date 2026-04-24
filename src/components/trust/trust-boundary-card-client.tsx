"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

/** Client copy of {@link TrustBoundaryCard} for use inside client flows (e.g. booking wizard). */
export function TrustBoundaryCardClient() {
  const t = useTranslations("TrustScope");
  const included = t.raw("included") as string[];
  const excluded = t.raw("excluded") as string[];

  return (
    <Card className="border-primary/15 border-l-[3px] border-l-[var(--brand-trust-blue)] bg-card/80 shadow-[var(--shadow-sm)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">{t("title")}</CardTitle>
        <p className="text-muted-foreground text-sm leading-relaxed">{t("lead")}</p>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
            {t("includedLabel")}
          </p>
          <ul className="text-muted-foreground space-y-2 text-sm">
            {included.map((line) => (
              <li key={line} className="flex gap-2">
                <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
            {t("excludedLabel")}
          </p>
          <ul className="text-muted-foreground space-y-2 text-sm">
            {excluded.map((line) => (
              <li key={line} className="flex gap-2">
                <X className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
