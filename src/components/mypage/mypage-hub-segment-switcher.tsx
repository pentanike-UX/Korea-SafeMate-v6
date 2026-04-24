"use client";

import { useTranslations } from "next-intl";
import {
  ATTENTION_COUNT_DISPLAY_CAP_COMPACT,
  attentionCountAccessibleLabel,
  formatAttentionCountForDisplay,
} from "@/lib/mypage/attention-badge-display";
import { cn } from "@/lib/utils";

function SegmentCountBadge({ count, ariaLabel }: { count: number; ariaLabel: string }) {
  if (count <= 0) return null;
  const label = formatAttentionCountForDisplay(count, ATTENTION_COUNT_DISPLAY_CAP_COMPACT);
  return (
    <span
      role="status"
      aria-label={attentionCountAccessibleLabel(ariaLabel, count)}
      className="bg-[var(--brand-trust-blue)]/18 text-[var(--brand-trust-blue)] ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums"
    >
      {label}
    </span>
  );
}

export function MypageHubSegmentSwitcher({
  hubMode,
  setHubMode,
  travelerBadgeCount,
  guardianBadgeCount,
  guardianTabMuted,
}: {
  hubMode: "traveler" | "guardian";
  setHubMode: (m: "traveler" | "guardian") => void;
  travelerBadgeCount: number;
  guardianBadgeCount: number;
  guardianTabMuted: boolean;
}) {
  const t = useTranslations("TravelerHub");

  return (
    <div>
      <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-widest uppercase">{t("modeSegmentLabel")}</p>
      <div
        className="flex w-full max-w-full rounded-[var(--radius-md)] bg-muted/90 p-1.5 ring-1 ring-border/70"
        role="tablist"
        aria-label={t("modeSegmentAria")}
      >
        <button
          type="button"
          role="tab"
          aria-selected={hubMode === "traveler"}
          onClick={() => setHubMode("traveler")}
          className={cn(
            "relative flex min-h-11 flex-1 items-center justify-center gap-0.5 rounded-[calc(var(--radius-md)-2px)] px-2.5 text-xs font-semibold transition-colors sm:min-h-12 sm:px-3 sm:text-sm",
            hubMode === "traveler"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <span className="truncate">{t("modeSegmentTraveler")}</span>
          <SegmentCountBadge count={travelerBadgeCount} ariaLabel={t("segmentBadgeTravelerAria")} />
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={hubMode === "guardian"}
          onClick={() => setHubMode("guardian")}
          className={cn(
            "relative flex min-h-11 flex-1 items-center justify-center gap-0.5 rounded-[calc(var(--radius-md)-2px)] px-2.5 text-xs font-semibold transition-colors sm:min-h-12 sm:px-3 sm:text-sm",
            hubMode === "guardian"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            guardianTabMuted && hubMode !== "guardian" && "opacity-80",
          )}
        >
          <span className="truncate">{t("modeSegmentGuardian")}</span>
          {guardianTabMuted ? (
            <span className="text-muted-foreground ml-0.5 hidden text-[9px] font-semibold uppercase sm:inline">
              {t("modeSegmentGuardianStart")}
            </span>
          ) : null}
          <SegmentCountBadge count={guardianBadgeCount} ariaLabel={t("segmentBadgeGuardianAria")} />
        </button>
      </div>
      <p className="text-muted-foreground mt-2.5 text-[11px] leading-relaxed">{t("modeSegmentHint")}</p>
    </div>
  );
}
