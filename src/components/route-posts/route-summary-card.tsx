"use client";

import type { ReactNode } from "react";
import { CheckCircle2, Clock, Footprints, Gauge, MapPin, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RouteJourneyMetadata } from "@/types/domain";
import {
  POST_DETAIL_PARAGRAPH_STACK_COMPACT,
  POST_DETAIL_PROSE_P_COMPACT,
  splitPostBodyParagraphs,
} from "@/lib/post-detail-body-split";
import { cn } from "@/lib/utils";

function MetaRow({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="border-border/35 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-dashed pb-3 last:border-b-0 last:pb-0 sm:grid sm:grid-cols-[minmax(0,8rem)_1fr] sm:items-start sm:gap-x-6">
      <dt className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs font-medium tracking-wide">
        <span className="text-primary/70 [&_svg]:size-3.5">{icon}</span>
        {label}
      </dt>
      <dd className="text-text-strong w-full min-w-0 text-[15px] font-semibold tabular-nums leading-snug sm:w-auto sm:text-base">{value}</dd>
    </div>
  );
}

/**
 * 하루웨이 상단 요약 — 카드 대신 문서형 섹션(타이포·구분선·체크리스트).
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
    <section className={cn("border-border/45 max-w-[42rem] border-t pt-7 sm:pt-8", className)}>
      <header className="space-y-1">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.2em] uppercase">{t("summaryCardEyebrow")}</p>
        <h2 className="text-text-strong text-xl font-semibold tracking-tight sm:text-[1.35rem]">{t("summaryCardTitle")}</h2>
      </header>

      <dl className="mt-6 space-y-3">
        <MetaRow
          label={t("summarySpotsLabel")}
          value={t("chipSpots", { count: spotCount })}
          icon={<MapPin className="size-3.5 opacity-80" aria-hidden />}
        />
        <MetaRow
          label={t("summaryDistanceLabel")}
          value={t("chipDistance", { km: meta.estimated_total_distance_km.toFixed(1) })}
          icon={<Footprints className="size-3.5 opacity-80" aria-hidden />}
        />
        <MetaRow
          label={t("summaryDurationLabel")}
          value={t("chipDuration", { minutes: meta.estimated_total_duration_minutes })}
          icon={<Clock className="size-3.5 opacity-80" aria-hidden />}
        />
        <MetaRow
          label={t("summaryTransportLabel")}
          value={t(`transport.${meta.transport_mode}` as "transport.walk")}
          icon={<Footprints className="size-3.5 opacity-80" aria-hidden />}
        />
        <MetaRow
          label={t("summaryTimeOfDayLabel")}
          value={t(timeKey)}
          icon={<Sun className="size-3.5 opacity-80" aria-hidden />}
        />
        <MetaRow
          label={t("summaryPaceLabel")}
          value={t(`difficulty.${meta.difficulty}` as "difficulty.easy")}
          icon={<Gauge className="size-3.5 opacity-80" aria-hidden />}
        />
      </dl>

      <p className="text-muted-foreground mt-6 text-[13px] leading-relaxed">
        <span className="font-medium text-foreground">{meta.night_friendly ? t("nightYes") : t("nightNo")}</span>
        <span className="mx-2 text-border">·</span>
        {t("summaryNightHint")}
      </p>

      {goodItems.length > 0 ? (
        <div className="mt-8 space-y-3">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">{t("summaryGoodForLabel")}</p>
          <ul className="space-y-2.5" aria-label={t("summaryGoodForLabel")}>
            {goodItems.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-snug">
                <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0 opacity-85" aria-hidden />
                <span className="text-foreground min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : goodForLine ? (
        <div className="mt-8 space-y-2">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">{t("summaryGoodForLabel")}</p>
          <div className={`${POST_DETAIL_PARAGRAPH_STACK_COMPACT}`}>
            {splitPostBodyParagraphs(goodForLine).map((block, i) => (
              <p key={i} className={`font-medium ${POST_DETAIL_PROSE_P_COMPACT}`}>
                {block}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
