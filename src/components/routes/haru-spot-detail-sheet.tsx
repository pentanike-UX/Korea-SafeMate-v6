"use client";

import { useEffect, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { HaruSpot, AppLocale } from "@/types/haru";
import { cn } from "@/lib/utils";
import { SpotDetailContent } from "@/components/routes/spot-detail-content";

/**
 * 모바일 bottom sheet 전용 래퍼.
 * 데스크톱 Route Cockpit에서는 SpotDetailContent를 좌측 패널에 인라인으로 직접 렌더한다.
 */
export function HaruSpotDetailSheet({
  spot,
  locale,
  open,
  onOpenChange,
  side = "bottom",
  fullscreen = false,
}: {
  spot: HaruSpot | null;
  locale: AppLocale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "right" | "bottom";
  /** 모바일에서 전체 화면을 덮도록 — 핸들바 없이 라운드 제거하고 100dvh로 노출. */
  fullscreen?: boolean;
}) {
  // 모바일 전체화면 시트 — 폰 '뒤로가기'(history popstate)로 닫히게 연동.
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    let closedByPop = false;
    window.history.pushState({ haruSpotSheet: true }, "");
    const onPop = () => {
      closedByPop = true;
      onOpenChangeRef.current(false);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!closedByPop && window.history.state?.haruSpotSheet) {
        window.history.back();
      }
    };
  }, [open]);

  if (!spot) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        showCloseButton={false}
        backdropTransparent
        className={cn(
          "flex w-full flex-col gap-0 overflow-hidden p-0",
          "data-[side=right]:w-full data-[side=right]:sm:max-w-[440px] data-[side=right]:lg:max-w-[480px] data-[side=right]:xl:max-w-[520px]",
          fullscreen
            ? "data-[side=bottom]:h-[100dvh] data-[side=bottom]:max-h-[100dvh] data-[side=bottom]:rounded-none"
            : "data-[side=bottom]:max-h-[90vh] data-[side=bottom]:rounded-t-3xl",
        )}
        aria-label={spot.catalog.name[locale] ?? spot.catalog.name.en ?? "Spot"}
      >
        {side === "bottom" && !fullscreen ? (
          <div className="flex shrink-0 justify-center pt-2 pb-1" aria-hidden>
            <span className="bg-muted-foreground/30 h-1 w-10 rounded-full" />
          </div>
        ) : null}
        <SpotDetailContent key={spot.id} spot={spot} locale={locale} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
