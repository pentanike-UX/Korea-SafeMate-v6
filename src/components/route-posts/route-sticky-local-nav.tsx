"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { RouteSpot } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Map } from "lucide-react";

function spotShortName(spot: RouteSpot, maxLen: number) {
  const raw = spot.title?.trim() || spot.place_name?.trim() || "—";
  return raw.length > maxLen ? `${raw.slice(0, maxLen - 1)}…` : raw;
}

type Props = {
  spots: RouteSpot[];
  activeSpotId: string | null;
  onSpotNavigate: (id: string) => void;
  /** Scroll to the main route map card (hero map section). */
  onScrollToMainMap: () => void;
  isMobile: boolean;
};

export function RouteStickyLocalNav({ spots, activeSpotId, onSpotNavigate, onScrollToMainMap, isMobile }: Props) {
  const t = useTranslations("RoutePosts");
  const [expanded, setExpanded] = useState(true);
  const chipScrollDesktopRef = useRef<HTMLDivElement>(null);
  const chipScrollMobileRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!activeSpotId || !activeChipRef.current) return;
    const wrap = (isMobile ? chipScrollMobileRef.current : chipScrollDesktopRef.current) ?? null;
    if (!wrap) return;
    const chip = activeChipRef.current;
    const chipLeft = chip.offsetLeft;
    const chipW = chip.offsetWidth;
    const wrapW = wrap.clientWidth;
    const target = chipLeft - wrapW / 2 + chipW / 2;
    wrap.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeSpotId, isMobile]);

  const chipButtonClass = (active: boolean, mobile: boolean) =>
    cn(
      mobile
        ? "shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold"
        : "shrink-0 rounded-full border px-3 py-2 text-left text-xs font-medium transition-colors sm:text-[13px]",
      active
        ? "border-primary bg-primary text-primary-foreground shadow-sm"
        : mobile
          ? "border-border/70 bg-card/95 text-foreground backdrop-blur-sm"
          : "border-border/70 bg-card/90 text-foreground backdrop-blur-sm hover:border-primary/35 hover:bg-primary/5",
    );

  const renderChips = (mobile: boolean) => (
    <div
      ref={mobile ? chipScrollMobileRef : chipScrollDesktopRef}
      className={cn(
        "flex min-w-0 items-center gap-1.5 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        mobile ? "flex-1" : "min-h-[40px] min-w-0 flex-1 gap-1.5 py-1 lg:gap-2",
        !mobile && !expanded && "hidden",
      )}
      role="tablist"
      aria-label={t("stickyNavSpotsAria")}
    >
      {spots.map((spot, index) => {
        const short = spotShortName(spot, mobile ? 12 : 24);
        const full = `${index + 1}. ${spot.title?.trim() || spot.place_name || "—"}`;
        const active = spot.id === activeSpotId;
        return (
          <button
            key={spot.id}
            ref={active ? activeChipRef : undefined}
            type="button"
            role="tab"
            aria-selected={active}
            title={full}
            onClick={() => onSpotNavigate(spot.id)}
            className={chipButtonClass(active, mobile)}
          >
            <span
              className={cn(
                "tabular-nums font-semibold",
                active ? (mobile ? "" : "text-primary-foreground") : mobile ? "" : "text-primary",
              )}
            >
              {index + 1}
            </span>{" "}
            <span className={cn(!mobile && "font-medium")}>{short}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <nav
      className={cn(
        "fixed right-0 left-0 z-40 border-b border-border/60 bg-[color-mix(in_oklab,var(--background)_94%,transparent)] shadow-[0_1px_0_color-mix(in_oklab,var(--foreground)_5%,transparent)] backdrop-blur-md",
        "top-14 sm:top-16",
        isMobile ? "h-12 px-2" : "min-h-[3.25rem] px-3 py-1.5 sm:px-4",
      )}
      aria-label={t("stickyNavAria")}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-xl border-border/70 bg-card/90 shadow-sm backdrop-blur-sm"
          onClick={onScrollToMainMap}
          aria-label={t("stickyNavMapButtonAria")}
        >
          <Map className="size-4" aria-hidden />
        </Button>

        {isMobile ? renderChips(true) : renderChips(false)}

        {!isMobile ? (
          <div className="ml-auto flex shrink-0 items-center border-l border-border/50 pl-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground size-9 rounded-xl px-0 sm:size-10"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-label={expanded ? t("stickyNavCollapse") : t("stickyNavExpand")}
            >
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>
        ) : null}
      </div>

      {!isMobile && !expanded ? (
        <p className="text-muted-foreground mx-auto max-w-6xl px-4 pb-0.5 text-center text-[11px]">{t("stickyNavCollapsedHint")}</p>
      ) : null}
    </nav>
  );
}
