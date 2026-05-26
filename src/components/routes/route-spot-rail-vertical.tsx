"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { HaruRoute, HaruSpot, AppLocale } from "@/types/haru";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

/**
 * 데스크톱 Route Cockpit 좌측 세로 타임라인 레일.
 * - 클릭한 스팟은 우측 드로어로 노출.
 * - 선택된 스팟은 강조 표시.
 * - 첫 스팟부터 마지막까지 점선 커넥터로 시각적으로 이어짐.
 */
export function RouteSpotRailVertical({
  route,
  locale,
  selectedSpotId,
  onSpotClick,
  className,
}: {
  route: HaruRoute;
  locale: AppLocale;
  selectedSpotId?: string | null;
  onSpotClick: (spot: HaruSpot) => void;
  className?: string;
}) {
  const t = useTranslations("TravelerHub");
  return (
    <ol className={cn("relative flex flex-col gap-1.5 p-3 sm:p-4", className)} aria-label={t("routeViewerTimelineAria")}>
      {route.spots.map((spot, idx) => {
        const name = pick(spot.catalog.name, locale) ?? "Spot";
        const note = pick(spot.guardian_note, locale);
        const isSelected = selectedSpotId === spot.id;
        const moveMin = idx > 0 ? spot.move_from_prev_min : null;
        return (
          <li key={spot.id} className="relative">
            {idx > 0 ? (
              <div aria-hidden className="absolute -top-1.5 left-[1.625rem] flex h-1.5 items-center">
                <span className="block h-full w-px border-l-2 border-dashed border-line" />
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => onSpotClick(spot)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-2xl border p-2.5 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2",
                isSelected
                  ? "border-[var(--brand-primary)]/70 bg-[var(--brand-primary)]/8 shadow-[var(--shadow-sm)]"
                  : "border-border/60 bg-card hover:border-[var(--brand-primary)]/40 hover:bg-muted/40",
              )}
              aria-current={isSelected ? "true" : undefined}
            >
              <span className="relative shrink-0">
                <span
                  className={cn(
                    "bg-muted relative block size-14 overflow-hidden rounded-xl border",
                    isSelected ? "border-[var(--brand-primary)]/60" : "border-border/50",
                  )}
                >
                  {spot.catalog.image_url ? (
                    <Image
                      src={spot.catalog.image_url}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground flex size-full items-center justify-center text-2xl" aria-hidden>
                      {spot.catalog.category_emoji}
                    </span>
                  )}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "absolute -top-1 -left-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums shadow-sm",
                    isSelected
                      ? "bg-[var(--brand-primary)] text-white"
                      : "bg-foreground text-background",
                  )}
                >
                  {spot.order}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize">
                    {spot.catalog.category}
                  </span>
                  {spot.featured ? (
                    <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      ✦ Pick
                    </span>
                  ) : null}
                  <span className="text-muted-foreground ml-auto inline-flex items-center gap-0.5 text-[10px] tabular-nums">
                    <Clock className="size-3" aria-hidden /> {spot.stay_min}m
                  </span>
                </span>
                <span className="text-foreground mt-1 block truncate text-sm font-semibold">{name}</span>
                {note ? (
                  <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs leading-relaxed">{note}</span>
                ) : null}
                {moveMin ? (
                  <span className="text-muted-foreground mt-1.5 inline-flex items-center gap-1 text-[10px]">
                    <span aria-hidden>↘</span>
                    <span>+ {moveMin}m</span>
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function pick<T extends Partial<Record<AppLocale, string | null>>>(
  map: T | undefined,
  locale: AppLocale,
): string | undefined {
  if (!map) return undefined;
  const order: AppLocale[] = [locale, "en", "ko", "th", "vi"];
  for (const l of order) {
    const v = map[l];
    if (v) return v;
  }
  return undefined;
}
