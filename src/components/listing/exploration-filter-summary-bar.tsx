"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";

export type ExplorationSummaryChip = {
  id: string;
  label: string;
  onClear: () => void;
};

/**
 * Single-row sticky summary: active filters as removable chips (left, horizontal scroll),
 * result count + reset + “open filters” (right). Shared by posts & guardians listing pages.
 */
export function ExplorationFilterSummaryBar({
  chips,
  allExploringLabel,
  resultSummary,
  resultSummaryShort,
  showReset,
  resetLabel,
  onReset,
  openFiltersLabel,
  onOpenFilters,
  summaryAriaLabel,
  chipClearLabel,
}: {
  chips: ExplorationSummaryChip[];
  allExploringLabel: string;
  /** Full results line, e.g. “12 posts” — shown sm+ */
  resultSummary: string;
  /** Compact e.g. “12” or “12명” for narrow screens */
  resultSummaryShort: string;
  showReset: boolean;
  resetLabel: string;
  onReset: () => void;
  openFiltersLabel: string;
  onOpenFilters: () => void;
  summaryAriaLabel: string;
  chipClearLabel: (label: string) => string;
}) {
  return (
    <div
      className="flex min-h-9 flex-wrap items-center gap-x-1.5 gap-y-2 min-[400px]:gap-x-2 sm:min-h-10 sm:gap-x-2.5 sm:gap-y-2"
      aria-label={summaryAriaLabel}
    >
      <div
        className={cn(
          "border-border/60 bg-muted/35 flex min-h-9 min-w-0 flex-1 flex-wrap content-center items-center gap-1 rounded-[var(--radius-md)] border px-1.5 py-1.5 min-[400px]:gap-1.5 min-[400px]:px-2 sm:min-h-10 sm:gap-2 sm:px-2.5 sm:py-2",
        )}
      >
        {chips.length === 0 ? (
          <span className="text-muted-foreground px-1 py-0.5 text-[11px] font-medium sm:text-xs">{allExploringLabel}</span>
        ) : (
          chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={c.onClear}
              aria-label={chipClearLabel(c.label)}
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
      <div className="flex w-full min-w-0 shrink-0 flex-wrap items-center justify-end gap-1 min-[400px]:w-auto min-[400px]:gap-1.5 sm:gap-2">
        <span
          className="text-muted-foreground tabular-nums text-[11px] font-semibold sm:hidden"
          title={resultSummary}
        >
          {resultSummaryShort}
        </span>
        <span className="text-muted-foreground hidden max-w-[7rem] truncate text-xs font-medium tabular-nums sm:inline md:max-w-[10rem] lg:max-w-none" title={resultSummary}>
          {resultSummary}
        </span>
        {showReset ? (
          <Button type="button" variant="ghost" size="sm" className="h-9 min-h-9 px-2.5 text-xs font-semibold" onClick={onReset}>
            {resetLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-border/80 bg-background h-9 min-h-9 shrink-0 gap-1.5 rounded-[var(--radius-md)] px-3 text-xs font-semibold shadow-sm"
          onClick={onOpenFilters}
        >
          <SlidersHorizontal className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          {openFiltersLabel}
        </Button>
      </div>
    </div>
  );
}
