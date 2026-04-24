"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { LaunchAreaSlug } from "@/types/launch-area";
import { StickyListingFiltersBar } from "@/components/listing/sticky-listing-filters-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";
import type { PartySize, SceneMoodId, GuardianStyleId, TripWhenPreset } from "@/components/explore/explore-journey-data";

type Pace = "calm" | "balanced" | "packed";
type LangPref = "en" | "ko" | "ja" | "any";
type EditTarget = "basics" | "schedule" | "taste";
type SummaryChip = { id: string; label: string; editTarget: EditTarget };

export function ExploreJourneySummaryBar({
  step,
  region,
  theme,
  days,
  partySize,
  pace,
  langPref,
  tripWhenPreset,
  sceneMoods,
  guardianStylePrefs,
  workTokens,
  artistTokens,
  onEditBasics,
  variant = "journey",
  onEditSchedule,
  onEditTaste,
}: {
  step: number;
  region: LaunchAreaSlug | "";
  theme: string;
  days: string;
  partySize: PartySize;
  pace: Pace;
  langPref: LangPref;
  tripWhenPreset: TripWhenPreset | null;
  sceneMoods: SceneMoodId[];
  guardianStylePrefs: GuardianStyleId[];
  workTokens: string[];
  artistTokens: string[];
  onEditBasics?: () => void;
  variant?: "journey" | "results";
  onEditSchedule?: () => void;
  onEditTaste?: () => void;
}) {
  const t = useTranslations("ExploreJourney");
  const tLaunch = useTranslations("LaunchAreas");
  const tThemes = useTranslations("ExperienceThemes");

  const hasAnything = Boolean(region) || Boolean(theme) || step >= 2;
  const isResults = variant === "results";

  const chips = useMemo<SummaryChip[]>(() => {
    const result: SummaryChip[] = [];

    if (region) {
      try {
        result.push({ id: "region", label: (tLaunch.raw(region) as { name: string }).name, editTarget: "basics" });
      } catch { /* skip */ }
    }
    if (theme) {
      try {
        result.push({ id: "theme", label: (tThemes.raw(theme) as { title: string }).title, editTarget: "basics" });
      } catch { /* skip */ }
    }

    if (step >= 2) {
      const tripKey = days === "1" ? "tripDays1" : days === "2" ? "tripDays2" : "tripDays3";
      result.push({ id: "days", label: t(tripKey), editTarget: "schedule" });
      result.push({ id: "party", label: t(`party_${partySize}` as "party_solo"), editTarget: "schedule" });
      result.push({ id: "pace", label: pace === "calm" ? t("paceCalm") : pace === "balanced" ? t("paceBalanced") : t("pacePacked"), editTarget: "schedule" });
      result.push({ id: "lang", label: langPref === "any" ? t("langAny") : langPref.toUpperCase(), editTarget: "schedule" });
      if (tripWhenPreset) {
        result.push({ id: "when", label: t(`tripWhen_${tripWhenPreset}` as "tripWhen_weekend"), editTarget: "schedule" });
      }
    }

    if (step >= 3) {
      sceneMoods.slice(0, 3).forEach((id) => {
        result.push({ id: `scene_${id}`, label: t(`moodScene_${id.replace(/^scene_/, "")}` as "moodScene_neon"), editTarget: "taste" });
      });
      guardianStylePrefs
        .filter((id) => id !== "style_no_match_test")
        .slice(0, 2)
        .forEach((id) => {
          result.push({ id: `style_${id}`, label: t(`moodStyle_${id.replace(/^style_/, "")}` as "moodStyle_calm"), editTarget: "taste" });
        });
      workTokens.slice(0, 2).forEach((w) => result.push({ id: `work_${w}`, label: w, editTarget: "taste" }));
      artistTokens.slice(0, 2).forEach((w) => result.push({ id: `artist_${w}`, label: w, editTarget: "taste" }));
    }

    return result;
  }, [region, theme, step, days, partySize, pace, langPref, tripWhenPreset, sceneMoods, guardianStylePrefs, workTokens, artistTokens, t, tLaunch, tThemes]);

  if (!hasAnything) return null;

  function handleChipClick(editTarget: EditTarget) {
    if (editTarget === "basics") onEditBasics?.();
    else if (editTarget === "schedule") onEditSchedule?.();
    else onEditTaste?.();
  }

  const hasEditActions =
    (step >= 2 && onEditBasics) ||
    (isResults && onEditSchedule) ||
    (isResults && onEditTaste);

  return (
    <StickyListingFiltersBar innerClassName="py-2 sm:py-2.5">
      <div
        className="flex min-h-9 flex-wrap items-center gap-x-1.5 gap-y-2 min-[400px]:gap-x-2 sm:min-h-10 sm:gap-x-2.5 sm:gap-y-2"
        aria-label={t("summaryBarAria")}
      >
        {/* 칩 영역 */}
        <div className="border-border/60 bg-muted/35 flex min-h-9 min-w-0 flex-1 flex-wrap content-center items-center gap-1 rounded-[var(--radius-md)] border px-1.5 py-1.5 min-[400px]:gap-1.5 min-[400px]:px-2 sm:min-h-10 sm:gap-2 sm:px-2.5 sm:py-2">
          {chips.length === 0 ? (
            <span className="text-muted-foreground px-1 py-0.5 text-[11px] font-medium sm:text-xs">
              {isResults ? t("summaryBarLabelResults") : t("summaryBarLabel")}
            </span>
          ) : (
            chips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleChipClick(c.editTarget)}
                className={cn(
                  "border-primary/20 bg-primary text-primary-foreground shadow-sm",
                  "inline-flex h-9 min-h-9 max-w-full min-w-0 items-center gap-1 rounded-full border px-2 pl-2.5 text-[11px] font-semibold sm:max-w-[min(280px,42vw)] sm:px-2.5 sm:pl-3 sm:text-xs",
                  "active:scale-[0.98]",
                )}
              >
                <span className="min-w-0 truncate">{c.label}</span>
                <X className="size-3.5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
              </button>
            ))
          )}
        </div>

        {/* 우측 수정 버튼 */}
        <div className="flex w-full min-w-0 shrink-0 flex-wrap items-center justify-end gap-1 min-[400px]:w-auto min-[400px]:gap-1.5 sm:gap-2">
          {hasEditActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="border-border/80 bg-background inline-flex h-9 min-h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-xs font-semibold shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SlidersHorizontal className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                {t("editConditions")}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                {step >= 2 && onEditBasics ? (
                  <DropdownMenuItem onClick={onEditBasics}>
                    {isResults ? t("editConditions") : t("editAreaTheme")}
                  </DropdownMenuItem>
                ) : null}
                {isResults && onEditSchedule ? (
                  <DropdownMenuItem onClick={onEditSchedule}>
                    {t("editScheduleShort")}
                  </DropdownMenuItem>
                ) : null}
                {isResults && onEditTaste ? (
                  <DropdownMenuItem onClick={onEditTaste}>
                    {t("editTasteShort")}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </StickyListingFiltersBar>
  );
}
