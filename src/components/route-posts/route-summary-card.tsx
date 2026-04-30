"use client";

import type { ReactNode } from "react";
import { CheckCircle2, Clock, Footprints, Gauge, MapPin, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RouteJourneyMetadata } from "@/types/domain";
import { Card, CardContent } from "@/components/ui/card";
import {
  POST_DETAIL_PARAGRAPH_STACK_COMPACT,
  POST_DETAIL_PROSE_P_COMPACT,
  splitPostBodyParagraphs,
} from "@/lib/post-detail-body-split";
import { cn } from "@/lib/utils";

function StatCell({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-xl border border-border/50 bg-muted/15 px-3 py-2.5 sm:px-4 sm:py-3", className)}>
      <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase">
        <span className="text-primary/80 [&_svg]:size-3.5">{icon}</span>
        {label}
      </div>
      <p className="text-text-strong mt-1 text-sm font-semibold tabular-nums sm:text-base">{value}</p>
    </div>
  );
}

/**
 * 하루웨이 요약 — 카드 UI 유지 (상단 스택에서 유일하게 카드 역할).
 */
export function RouteSummaryCard({
  meta,
  spotCount,
  goodForLine,
  className,
}: {
  meta: RouteJourneyMetadata;
  spotCount: number;
  /** "이 루트가 잘 맞는 사람" 한 줄 — recommended_traveler_types 등 */
  goodForLine: string | null;
  className?: string;
}) {
  const t = useTranslations("RoutePosts");

  const timeKey = `recommendedTime.${meta.recommended_time_of_day}` as const;
  const goodItems = goodForLine
    ? goodForLine
        .split(/\s*·\s*/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <Card className={cn("border-border/60 max-w-[42rem] gap-0 overflow-hidden rounded-2xl py-0 shadow-[var(--shadow-md)]", className)}>
      <div className="border-border/60 border-b bg-white/95 px-5 py-4 sm:px-6 sm:py-4 dark:bg-card/90">
        <p className="text-primary text-[10px] font-bold tracking-[0.2em] uppercase">{t("summaryCardEyebrow")}</p>
        <h2 className="text-text-strong mt-1 text-lg font-semibold sm:text-xl">{t("summaryCardTitle")}</h2>
      </div>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCell
            label={t("summarySpotsLabel")}
            value={t("chipSpots", { count: spotCount })}
            icon={<MapPin className="size-3.5 opacity-80" aria-hidden />}
          />
          <StatCell
            label={t("summaryDistanceLabel")}
            value={t("chipDistance", { km: meta.estimated_total_distance_km.toFixed(1) })}
            icon={<Footprints className="size-3.5 opacity-80" aria-hidden />}
          />
          <StatCell
            label={t("summaryDurationLabel")}
            value={t("chipDuration", { minutes: meta.estimated_total_duration_minutes })}
            icon={<Clock className="size-3.5 opacity-80" aria-hidden />}
          />
          <StatCell
            label={t("summaryTransportLabel")}
            value={t(`transport.${meta.transport_mode}` as "transport.walk")}
            icon={<Footprints className="size-3.5 opacity-80" aria-hidden />}
          />
          <StatCell
            label={t("summaryTimeOfDayLabel")}
            value={t(timeKey)}
            icon={<Sun className="size-3.5 opacity-80" aria-hidden />}
          />
          <StatCell
            label={t("summaryPaceLabel")}
            value={t(`difficulty.${meta.difficulty}` as "difficulty.easy")}
            icon={<Gauge className="size-3.5 opacity-80" aria-hidden />}
          />
        </div>

        <p className="text-muted-foreground text-center text-xs sm:text-left">
          <span className="font-semibold text-foreground">{meta.night_friendly ? t("nightYes") : t("nightNo")}</span>
          <span className="mx-1.5 text-border">·</span>
          {t("summaryNightHint")}
        </p>

        {goodItems.length > 0 ? (
          <div className="border-primary/15 rounded-xl border bg-primary/5 px-4 py-3">
            <p className="text-primary text-[10px] font-bold tracking-wide uppercase">{t("summaryGoodForLabel")}</p>
            <ul className="mt-3 space-y-2.5" aria-label={t("summaryGoodForLabel")}>
              {goodItems.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-snug">
                  <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0 opacity-85" aria-hidden />
                  <span className="text-foreground min-w-0 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : goodForLine ? (
          <div className="border-primary/15 rounded-xl border bg-primary/5 px-4 py-3">
            <p className="text-primary text-[10px] font-bold tracking-wide uppercase">{t("summaryGoodForLabel")}</p>
            <div className={`mt-2 ${POST_DETAIL_PARAGRAPH_STACK_COMPACT}`}>
              {splitPostBodyParagraphs(goodForLine).map((block, i) => (
                <p key={i} className={`font-medium ${POST_DETAIL_PROSE_P_COMPACT}`}>
                  {block}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
