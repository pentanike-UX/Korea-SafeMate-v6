"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Sparkles, List, Map as MapIcon } from "lucide-react";
import { HaruTimeline } from "@/components/patterns/haru-timeline";
import { RouteFreePreviewSection } from "@/components/routes/route-free-preview-section";
import { HaruSpotDetailSheet } from "@/components/routes/haru-spot-detail-sheet";
import { HaruRouteMapView } from "@/components/routes/haru-route-map-view";
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider";
import type { HaruRoute, HaruSpot, AppLocale } from "@/types/haru";
import { cn } from "@/lib/utils";

/**
 * 라우트 페이지 클라이언트 컨테이너.
 * 초기 상태: locked (무료 영역만 노출 + Unlock CTA).
 * 가짜 결제 완료 시 → unlocked (전체 타임라인 + 저장/수정 활성).
 */
export interface RouteViewPrecomputedDirections {
  path: Array<{ lat: number; lng: number }>;
  legs: Array<{ distance_m: number | null; duration_s: number | null }>;
  provider: "google" | "osrm";
}

export function RouteViewClient({
  route,
  locale,
  initialUnlocked,
  precomputedDirections = null,
}: {
  route: HaruRoute;
  locale: AppLocale;
  /** server 시점에 이미 unlocked로 결정된 경우(예: 본인 커스텀 루트) */
  initialUnlocked: boolean;
  /** 서버에서 미리 계산해둔 directions 결과 — 지도 뷰가 자체 fetch 생략. */
  precomputedDirections?: RouteViewPrecomputedDirections | null;
}) {
  const t = useTranslations("TravelerHub");
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [viewMode, setViewMode] = useState<"timeline" | "map">("timeline");
  // 스팟 상세 시트 — 잠금 해제 후만 활성
  const [selectedSpot, setSelectedSpot] = useState<HaruSpot | null>(null);

  // 진입 시·잠금 해제 시 페이지 최상단으로 스크롤 — 하단에 머물러 위로 올려야 하는 문제 해결.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [unlocked]);

  if (!unlocked) {
    return <RouteFreePreviewSection route={route} locale={locale} onUnlock={() => setUnlocked(true)} />;
  }

  // 유료 영역
  return (
    <GoogleMapsProvider>
    <div className="space-y-6 pb-24">
      {/* 결제 완료 배너 */}
      <div className="mx-auto mt-4 max-w-3xl px-4 sm:px-6">
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-700/30 dark:bg-emerald-950/20">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <Check className="size-5" strokeWidth={3} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <Sparkles className="size-3" />
              {t("routePaidKickerFull")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {t("routePaidBannerLead")}
            </p>
          </div>
        </div>
      </div>

      {/* 타임라인 / 지도 탭 전환 */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="inline-flex rounded-xl border border-border/50 bg-muted/50 p-1 gap-1">
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
              viewMode === "timeline"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="size-3.5" aria-hidden />
            타임라인
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
              viewMode === "map"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MapIcon className="size-3.5" aria-hidden />
            지도
          </button>
        </div>
      </div>

      {/* 타임라인 뷰 */}
      {viewMode === "timeline" && (
        <div className="px-4 sm:px-6 md:px-8">
          <HaruTimeline route={route} locale={locale} onSpotClick={(s) => setSelectedSpot(s)} />
        </div>
      )}

      {/* 지도 뷰 */}
      {viewMode === "map" && (
        <div className="px-4 sm:px-6 md:px-8">
          <HaruRouteMapView
            route={route}
            locale={locale}
            onSpotClick={(s) => setSelectedSpot(s)}
            className="h-[min(70vh,640px)]"
            precomputedPath={precomputedDirections?.path ?? null}
            precomputedProvider={precomputedDirections?.provider ?? null}
          />
        </div>
      )}

      {/* 스팟 상세 시트 — 하루웨이의 "하루 흐름"과 동일한 풍부 콘텐츠 노출 */}
      <HaruSpotDetailSheet
        spot={selectedSpot}
        locale={locale}
        open={selectedSpot != null}
        onOpenChange={(open) => {
          if (!open) setSelectedSpot(null);
        }}
      />

      {/* 다음 단계 미니 가이드 */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("routeNextStepsTitle")}
          </p>
          <ol className="mt-4 space-y-3">
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex items-start gap-3 rounded-2xl border border-border/40 bg-background/50 p-3">
                <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold">
                  {n}
                </span>
                <p className="text-sm leading-relaxed text-foreground/85">
                  {t(`routeNextStep${n}`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 하단 sticky 액션 바 (저장 / 수정 요청) */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-xs text-muted-foreground">
            {route.spots.length} {t("routeStatsStops").toLowerCase()}
            {" · "}
            {Math.floor(route.total_duration_min / 60) > 0
              ? t("routeHoursOnly", { h: Math.floor(route.total_duration_min / 60) })
              : ""}
            {route.total_duration_min % 60 > 0
              ? ` ${t("routeMinutesOnly", { m: route.total_duration_min % 60 })}`
              : ""}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className={cn(
                "rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground",
                "transition-colors hover:bg-muted/50",
              )}
            >
              {t("routeRequestEditCta")}
            </button>
            <button
              type="button"
              className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-on-brand)] shadow-sm transition-all hover:opacity-95"
            >
              {t("routeSaveCta")}
            </button>
          </div>
        </div>
      </div>
    </div>
    </GoogleMapsProvider>
  );
}
