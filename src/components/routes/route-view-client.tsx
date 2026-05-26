"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { List, Map as MapIcon, Bookmark, BookmarkCheck, Loader2, ArrowLeft, Share2 } from "lucide-react";
import { HaruTimeline } from "@/components/patterns/haru-timeline";
import { RouteFreePreviewSection } from "@/components/routes/route-free-preview-section";
import { HaruSpotDetailSheet } from "@/components/routes/haru-spot-detail-sheet";
import { HaruRouteMapView } from "@/components/routes/haru-route-map-view";
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider";
import { useRouter } from "@/i18n/navigation";
import { toggleSavedRouteAction } from "@/app/[locale]/(public)/routes/[routeId]/saved-route-actions";
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
  canSave = false,
  initialSaved = false,
}: {
  route: HaruRoute;
  locale: AppLocale;
  /** server 시점에 이미 unlocked로 결정된 경우(예: 본인 커스텀 루트) */
  initialUnlocked: boolean;
  /** 서버에서 미리 계산해둔 directions 결과 — 지도 뷰가 자체 fetch 생략. */
  precomputedDirections?: RouteViewPrecomputedDirections | null;
  /** UUID 루트(DB)만 저장 가능 — mock/preview 제외. */
  canSave?: boolean;
  /** 진입 시 이미 저장돼 있는지. */
  initialSaved?: boolean;
}) {
  const t = useTranslations("TravelerHub");
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [viewMode, setViewMode] = useState<"timeline" | "map">("timeline");
  // 스팟 상세 시트 — 잠금 해제 후만 활성
  const [selectedSpot, setSelectedSpot] = useState<HaruSpot | null>(null);
  const [saved, setSaved] = useState(initialSaved);
  const [savePending, startSaveTransition] = useTransition();

  function onToggleSave() {
    startSaveTransition(async () => {
      const res = await toggleSavedRouteAction(route.id);
      if (res.ok) setSaved(Boolean(res.saved));
    });
  }

  /**
   * 전면 플레이어 이탈.
   * - 데모 잠금해제(미결제 진입)였다면 → 프리뷰로 복귀.
   * - 서버 잠금해제(결제/소유)였다면 → 왔던 곳(히스토리) 또는 내 루트 목록 폴백.
   */
  function exitPlayer() {
    if (!initialUnlocked) {
      setUnlocked(false);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/mypage/routes");
    }
  }

  function sharePlayer() {
    if (typeof window === "undefined") return;
    const title = route.title[locale] ?? route.title.en ?? "Route";
    const url = `${window.location.origin}/routes/${route.id}`;
    if (navigator.share) {
      void navigator.share({ title, url }).catch(() => {});
    } else if (navigator.clipboard) {
      void navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  // 전면 플레이어가 열린 동안 배경(셸) 스크롤 잠금 + ESC 이탈.
  useEffect(() => {
    if (!unlocked || typeof document === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitPlayer();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  if (!unlocked) {
    return <RouteFreePreviewSection route={route} locale={locale} onUnlock={() => setUnlocked(true)} />;
  }

  const title = route.title[locale] ?? route.title.en ?? "Route";

  // 유료 영역 — 헤더/푸터를 덮는 전면 몰입 플레이어
  const durH = Math.floor(route.total_duration_min / 60);
  const durM = route.total_duration_min % 60;

  return (
    <GoogleMapsProvider>
      <div className="bg-background fixed inset-0 z-[60] flex flex-col">
        {/* ── 상단 글래스 바 — 이탈 / 하루이 / 모드 / 공유·저장 ── */}
        <header className="border-border/60 bg-background/90 relative z-10 shrink-0 border-b backdrop-blur-lg">
          <div className="flex items-center gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:gap-3 sm:px-4">
            <button
              type="button"
              onClick={exitPlayer}
              aria-label={t("spotDetailCloseAria")}
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-10 shrink-0 items-center justify-center rounded-full transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="border-border/60 bg-muted size-9 shrink-0 overflow-hidden rounded-full border">
                {route.guardian.photo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={route.guardian.photo_url} alt="" className="size-full object-cover" />
                ) : null}
              </span>
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-bold leading-tight sm:text-[15px]">{title}</p>
                <p className="text-muted-foreground truncate text-[11px] leading-tight">
                  {route.guardian.display_name}
                  <span className="text-emerald-600 dark:text-emerald-400"> · {t("routePaidKickerFull")}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={sharePlayer}
              aria-label="share"
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-10 shrink-0 items-center justify-center rounded-full transition-colors"
            >
              <Share2 className="size-5" />
            </button>
            {canSave ? (
              <button
                type="button"
                onClick={onToggleSave}
                disabled={savePending}
                aria-pressed={saved}
                aria-label={saved ? t("routeSavedCta") : t("routeSaveCta")}
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-60",
                  saved
                    ? "text-[var(--brand-primary)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {savePending ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                ) : saved ? (
                  <BookmarkCheck className="size-5" aria-hidden />
                ) : (
                  <Bookmark className="size-5" aria-hidden />
                )}
              </button>
            ) : null}
          </div>

          {/* 모드 토글 (좌측 정렬) */}
          <div className="px-2 pb-2 sm:px-4">
            <div className="border-border/50 bg-muted/50 inline-flex gap-1 rounded-xl border p-1">
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
        </header>

        {/* ── 본문 ── */}
        <div className="relative min-h-0 flex-1">
          {viewMode === "map" ? (
            <HaruRouteMapView
              route={route}
              locale={locale}
              onSpotClick={(s) => setSelectedSpot(s)}
              className="absolute inset-0 size-full"
              precomputedPath={precomputedDirections?.path ?? null}
              precomputedProvider={precomputedDirections?.provider ?? null}
            />
          ) : (
            <div className="h-full overflow-y-auto overscroll-contain py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {/* 스팟 가로 레일 — 전체 너비 사용(자체 가로 스크롤) */}
              <div className="px-4 sm:px-6 md:px-8">
                <HaruTimeline route={route} locale={locale} onSpotClick={(s) => setSelectedSpot(s)} />
              </div>

              {/* 다음 단계 — 좌측 정렬, 읽기 폭 제한 */}
              <div className="px-4 sm:px-6 md:px-8">
                <div className="border-border/50 bg-card mt-8 max-w-2xl rounded-3xl border p-5 shadow-sm sm:p-6">
                  <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                    {t("routeNextStepsTitle")}
                  </p>
                  <ol className="mt-4 space-y-3">
                    {[1, 2, 3].map((n) => (
                      <li
                        key={n}
                        className="border-border/40 bg-background/50 flex items-start gap-3 rounded-2xl border p-3"
                      >
                        <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold">
                          {n}
                        </span>
                        <p className="text-foreground/85 text-sm leading-relaxed">{t(`routeNextStep${n}`)}</p>
                      </li>
                    ))}
                  </ol>
                  <p className="text-muted-foreground mt-4 text-xs">
                    {route.spots.length} {t("routeStatsStops").toLowerCase()}
                    {durH > 0 ? ` · ${t("routeHoursOnly", { h: durH })}` : ""}
                    {durM > 0 ? ` ${t("routeMinutesOnly", { m: durM })}` : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 스팟 상세 시트 — 하루웨이의 "하루 흐름"과 동일한 풍부 콘텐츠 노출 */}
        <HaruSpotDetailSheet
          spot={selectedSpot}
          locale={locale}
          open={selectedSpot != null}
          onOpenChange={(open) => {
            if (!open) setSelectedSpot(null);
          }}
        />
      </div>
    </GoogleMapsProvider>
  );
}
