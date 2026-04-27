"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { HaruSpot, AppLocale } from "@/types/haru";

/** 머무는 시간 포맷 */
function formatStay(min: number): string {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

/** locale 우선순위로 텍스트 꺼내기 */
function localeText(
  map: Partial<Record<AppLocale, string | null>> | undefined,
  locale: AppLocale,
  fallback = "",
): string {
  if (!map) return fallback;
  const order: AppLocale[] = [locale, "en", "ko", "th", "vi"];
  for (const l of order) {
    const v = map[l];
    if (v) return v;
  }
  return fallback;
}

interface SpotCardProps {
  spot: HaruSpot;
  locale: AppLocale;
  /** 조감 모드 — 카드 높이·정보 축소 */
  compact?: boolean;
  /** 클릭 콜백 */
  onClick?: (spot: HaruSpot) => void;
  className?: string;
}

export function SpotCard({ spot, locale, compact = false, onClick, className }: SpotCardProps) {
  const name = localeText(spot.catalog.name, locale, spot.catalog.name.en ?? "");
  const note = localeText(spot.guardian_note, locale);
  const hasImage = Boolean(spot.catalog.image_url);

  return (
    <article
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(spot)}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(spot);
        }
      }}
      aria-label={name}
      className={cn(
        // 기본 크기: 모바일 75vw, 데스크톱은 compact 여부에 따라
        "group relative flex shrink-0 flex-col overflow-hidden",
        "rounded-[var(--radius-lg)] bg-bg-card border border-line",
        "shadow-[var(--shadow-sm)] transition-shadow duration-200",
        "hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ksm focus-visible:ring-offset-2",
        compact
          ? "w-48 sm:w-52"
          : "w-[72vw] min-w-[260px] max-w-[320px] sm:w-72 md:w-80",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* ── 이미지 영역 ── */}
      <div
        className={cn(
          "relative overflow-hidden bg-bg-sunken",
          compact ? "h-28" : "h-44",
        )}
      >
        {hasImage ? (
          <Image
            src={spot.catalog.image_url!}
            alt={name}
            fill
            sizes="(max-width: 640px) 72vw, 320px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // 이미지 없을 때 카테고리 이모지 플레이스홀더
          <div className="flex h-full items-center justify-center">
            <span className={cn("select-none", compact ? "text-4xl" : "text-6xl")} aria-hidden>
              {spot.catalog.category_emoji}
            </span>
          </div>
        )}

        {/* 스팟 번호 뱃지 */}
        <div
          aria-hidden
          className={cn(
            "absolute top-3 left-3 flex items-center justify-center rounded-full font-semibold tabular-nums leading-none",
            "bg-ink text-bg shadow-[var(--shadow-sm)]",
            compact ? "size-6 text-[11px]" : "size-8 text-sm",
          )}
        >
          {spot.order}
        </div>

        {/* 강조 스팟 리본 */}
        {spot.featured && !compact && (
          <div className="absolute top-3 right-3 rounded-full bg-accent-ksm px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            ✦ Pick
          </div>
        )}
      </div>

      {/* ── 텍스트 영역 ── */}
      <div className={cn("flex flex-1 flex-col", compact ? "gap-1 p-2.5" : "gap-2 p-4")}>

        {/* 카테고리 + 머무는 시간 */}
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-bg-sunken px-2 py-0.5 text-[10px] font-medium text-ink-muted capitalize">
            {spot.catalog.category}
          </span>
          <span className="ml-auto text-[10px] font-medium text-ink-soft tabular-nums">
            ⏱ {formatStay(spot.stay_min)}
          </span>
        </div>

        {/* 스팟 이름 */}
        <h3
          className={cn(
            "font-serif font-semibold text-ink leading-snug line-clamp-2",
            compact ? "text-sm" : "text-base",
          )}
        >
          {name}
        </h3>

        {/* 가디언 메모 — compact 모드에서는 숨김 */}
        {!compact && note && (
          <p className="text-xs text-ink-muted leading-relaxed line-clamp-3 flex-1">
            {note}
          </p>
        )}

        {/* 주소 */}
        {!compact && spot.catalog.address && (
          <p className="mt-auto text-[10px] text-ink-soft truncate">
            📍 {spot.catalog.address}
          </p>
        )}
      </div>
    </article>
  );
}
