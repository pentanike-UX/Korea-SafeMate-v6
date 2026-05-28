"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HaruiThanksListItem } from "@/lib/thanks-payments-list.server";

function formatPaidAt(iso: string, locale: string) {
  try {
    const tag =
      locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : locale === "vi" ? "vi-VN" : "en-US";
    return new Date(iso).toLocaleString(tag, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function GuardianThanksReceivedCard({ items }: { items: HaruiThanksListItem[] }) {
  const t = useTranslations("TravelerHub");
  const locale = useLocale();

  return (
    <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Heart className="text-[var(--brand-primary)] size-5" strokeWidth={1.75} aria-hidden />
          <CardTitle className="text-lg">{t("thanksReceivedTitle")}</CardTitle>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{t("thanksReceivedLead")}</p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm leading-relaxed">
            {t("thanksReceivedEmpty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <div className="border-border/60 flex flex-col gap-2 rounded-xl border bg-card/80 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-foreground text-sm font-semibold">{item.payer_label}</p>
                      {item.payer_kind === "guest" ? (
                        <Badge variant="outline" className="h-5 text-[10px] font-medium">
                          {t("thanksGuestBadge")}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      <Link href={`/routes/${item.route_id}`} className="hover:text-foreground font-medium underline-offset-2 hover:underline">
                        {item.route_title}
                      </Link>
                    </p>
                    {item.message ? (
                      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">“{item.message}”</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-foreground text-sm font-bold tabular-nums">
                      ₩{item.gross_amount.toLocaleString()}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[11px] tabular-nums">
                      {t("thanksReceivedHaruiNet", { amount: item.harui_amount.toLocaleString() })}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[11px]">{formatPaidAt(item.paid_at, locale)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
