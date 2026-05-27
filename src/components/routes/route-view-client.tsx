"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  List,
  Map as MapIcon,
  Bookmark,
  BookmarkCheck,
  Loader2,
  ArrowLeft,
  Share2,
  X,
  MessageCircle,
} from "lucide-react";
import { HaruTimeline } from "@/components/patterns/haru-timeline";
import { RouteFreePreviewSection } from "@/components/routes/route-free-preview-section";
import { HaruSpotDetailSheet } from "@/components/routes/haru-spot-detail-sheet";
import { HaruRouteMapView } from "@/components/routes/haru-route-map-view";
import { RouteSpotRailVertical } from "@/components/routes/route-spot-rail-vertical";
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider";
import { useRouter } from "@/i18n/navigation";
import { toggleSavedRouteAction } from "@/app/[locale]/(public)/routes/[routeId]/saved-route-actions";
import type { HaruRoute, HaruSpot, AppLocale } from "@/types/haru";
import { cn } from "@/lib/utils";
import { OnlineDot } from "@/components/guardians/guardian-online-status";
import {
  GUARDIAN_INQUIRY_OPEN_EVENT,
  type GuardianInquiryOpenDetail,
} from "@/components/guardians/guardian-inquiry-sheet";

/**
 * 라우트 페이지 클라이언트 컨테이너.
 * 초기 상태: locked (무료 영역만 노출 + Unlock CTA).
 * 가짜 결제 완료 시 → unlocked (전체 Route Cockpit).
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
  initialUnlocked: boolean;
  precomputedDirections?: RouteViewPrecomputedDirections | null;
  canSave?: boolean;
  initialSaved?: boolean;
}) {
  const t = useTranslations("TravelerHub");
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  /** 모바일 전용 — 데스크톱(md+)에서는 항상 split (타임라인 + 지도) */
  const [mobileViewMode, setMobileViewMode] = useState<"timeline" | "map">("map");
  const [selectedSpot, setSelectedSpot] = useState<HaruSpot | null>(null);
  const [saved, setSaved] = useState(initialSaved);
  const [savePending, startSaveTransition] = useTransition();
  const [isDesktop, setIsDesktop] = useState(false);

  // 데스크톱(md ≥768px) 감지 — 시트 side, 좌측 레일 노출 여부 결정.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  function onToggleSave() {
    startSaveTransition(async () => {
      const res = await toggleSavedRouteAction(route.id);
      if (res.ok) setSaved(Boolean(res.saved));
    });
  }

  const exitPlayer = useCallback(() => {
    // 네비게이션 직전 body 스크롤 잠금을 명시적으로 해제 — useEffect cleanup이
    // 라우터 이동 도중 늦게 호출돼 다음 페이지가 스크롤 불가가 되는 버그 방어.
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    if (!initialUnlocked) {
      setUnlocked(false);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/mypage/routes");
    }
  }, [initialUnlocked, router]);

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

  function openGuardianChat() {
    if (typeof window === "undefined") return;
    const detail: GuardianInquiryOpenDetail = {
      guardianUserId: route.guardian.user_id ?? undefined,
      displayName: route.guardian.display_name,
      avatarUrl: route.guardian.photo_url ?? undefined,
    };
    window.dispatchEvent(new CustomEvent<GuardianInquiryOpenDetail>(GUARDIAN_INQUIRY_OPEN_EVENT, { detail }));
  }

  // 전면 플레이어 동안 배경 셸 스크롤 잠금.
  // ESC와 분리 — selectedSpot/exitPlayer 변화로 effect가 재실행되며 cleanup이
  // 어긋나 다음 페이지에서 body가 잠겨 있는 문제 방지. unlocked에만 의존.
  useEffect(() => {
    if (!unlocked || typeof document === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [unlocked]);

  // ESC: 스팟 드로어가 열려 있으면 드로어만, 아니면 플레이어 이탈.
  useEffect(() => {
    if (!unlocked || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedSpot) setSelectedSpot(null);
      else exitPlayer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unlocked, selectedSpot, exitPlayer]);

  // 언마운트 시 body 스크롤을 반드시 풀어준다 — 라우터 이동으로 컴포넌트가
  // 떼어질 때 다음 페이지가 스크롤 불가로 남는 버그 방어.
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, []);

  if (!unlocked) {
    return <RouteFreePreviewSection route={route} locale={locale} onUnlock={() => setUnlocked(true)} />;
  }

  const title = route.title[locale] ?? route.title.en ?? "Route";

  const durH = Math.floor(route.total_duration_min / 60);
  const durM = route.total_duration_min % 60;
  const durationLabel = durH > 0 ? (durM > 0 ? `${durH}시간 ${durM}분` : `${durH}시간`) : `${durM}분`;
  const fmtKrw = (n: number) => (n >= 10000 ? `${Math.round(n / 10000)}만원` : `${n.toLocaleString()}원`);
  const costLabel =
    route.estimated_cost_min_krw != null
      ? route.estimated_cost_max_krw != null
        ? `${fmtKrw(route.estimated_cost_min_krw)}~${fmtKrw(route.estimated_cost_max_krw)}`
        : fmtKrw(route.estimated_cost_min_krw)
      : null;

  // 본문 — 데스크톱(md+): 좌 세로 레일 + 우 지도(드로어가 그 위로 오버레이).
  //          모바일(<md): 모드 토글로 타임라인(가로 카드) ↔ 지도 전환.
  const MapView = (
    <HaruRouteMapView
      route={route}
      locale={locale}
      onSpotClick={(s) => setSelectedSpot(s)}
      className="absolute inset-0 size-full"
      precomputedPath={precomputedDirections?.path ?? null}
      precomputedProvider={precomputedDirections?.provider ?? null}
    />
  );

  return (
    <GoogleMapsProvider>
      <div className="bg-background fixed inset-0 z-[60] flex flex-col">
        {/* ── Top Bar: 좌(← 요약) | 중앙(제목+메타) | 우(하루이 + 채팅 + 공유 + 저장 + X) ── */}
        <header className="border-border/60 bg-background/92 relative z-10 shrink-0 border-b backdrop-blur-lg">
          <div className="flex items-center gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:gap-3 sm:px-4">
            {/* 좌: ← 루트 요약 */}
            <button
              type="button"
              onClick={exitPlayer}
              aria-label={t("routeViewerSummaryLabel")}
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors sm:px-3"
            >
              <ArrowLeft className="size-5" />
              <span className="hidden text-xs font-semibold sm:inline">{t("routeViewerSummaryLabel")}</span>
            </button>

            {/* 중앙: 제목 + 메타 칩 — 좌측 정렬 */}
            <div className="min-w-0 flex-1 text-left">
              <p className="text-foreground truncate text-sm font-bold leading-tight sm:text-[15px]">{title}</p>
              <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1 text-[11px] leading-tight">
                <span className="bg-muted rounded-md px-1.5 py-0.5 font-medium tabular-nums">⏱ {durationLabel}</span>
                {costLabel ? (
                  <span className="bg-muted rounded-md px-1.5 py-0.5 font-medium tabular-nums">₩ {costLabel}</span>
                ) : null}
                <span className="bg-muted rounded-md px-1.5 py-0.5 font-medium tabular-nums">
                  📍 {route.spots.length} {t("routeStatsStops").toLowerCase()}
                </span>
              </div>
            </div>

            {/* 우: 하루이 + 채팅 + 공유 + 저장 + X */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <div className="hidden items-center gap-2 pr-1 sm:flex">
                <span className="relative shrink-0">
                  <span className="border-border/60 bg-muted block size-8 overflow-hidden rounded-full border">
                    {route.guardian.photo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={route.guardian.photo_url} alt="" className="size-full object-cover" />
                    ) : null}
                  </span>
                  <OnlineDot lastSeenAt={route.guardian.last_seen_at} size="sm" />
                </span>
                <div className="hidden min-w-0 leading-tight md:block">
                  <p className="text-foreground max-w-[10rem] truncate text-xs font-semibold">
                    {route.guardian.display_name}
                  </p>
                  <p className="text-muted-foreground text-[10px]">{t("routePaidKickerFull")}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={openGuardianChat}
                aria-label={t("routeViewerChatGuardian")}
                title={t("routeViewerChatGuardian")}
                className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-10 shrink-0 items-center justify-center rounded-full transition-colors"
              >
                <MessageCircle className="size-5" />
              </button>
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
                    saved ? "text-[var(--brand-primary)]" : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
              <button
                type="button"
                onClick={exitPlayer}
                aria-label={t("routeViewerCloseLabel")}
                className="text-muted-foreground hover:bg-muted hover:text-foreground hidden size-10 shrink-0 items-center justify-center rounded-full transition-colors sm:flex"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* 모드 토글 — 모바일 전용 (데스크톱은 split 레이아웃이라 불필요) */}
          <div className="px-2 pb-2 sm:hidden">
            <div className="border-border/50 bg-muted/50 inline-flex gap-1 rounded-xl border p-1">
              <button
                type="button"
                onClick={() => setMobileViewMode("timeline")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
                  mobileViewMode === "timeline"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="size-3.5" aria-hidden />
                {t("routeViewerModeTimeline")}
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode("map")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
                  mobileViewMode === "map"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MapIcon className="size-3.5" aria-hidden />
                {t("routeViewerModeMap")}
              </button>
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="relative min-h-0 flex-1">
          {/* 데스크톱: split 레이아웃 (좌 세로 레일 + 우 지도) */}
          <div className="hidden h-full md:grid md:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
            <aside className="border-border/60 bg-card/30 h-full overflow-y-auto border-r overscroll-contain">
              <RouteSpotRailVertical
                route={route}
                locale={locale}
                selectedSpotId={selectedSpot?.id ?? null}
                onSpotClick={(s) => setSelectedSpot(s)}
              />
              <div className="px-3 pb-5 sm:px-4">
                <NextStepsBlock t={t} spotsCount={route.spots.length} durH={durH} durM={durM} />
              </div>
            </aside>
            <div className="relative min-h-0">{MapView}</div>
          </div>

          {/* 모바일: 모드 토글로 전환 */}
          <div className="h-full md:hidden">
            {mobileViewMode === "map" ? (
              MapView
            ) : (
              <div className="h-full overflow-y-auto overscroll-contain py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <div className="px-4 sm:px-6">
                  <HaruTimeline route={route} locale={locale} hideHeader onSpotClick={(s) => setSelectedSpot(s)} />
                </div>
                <div className="px-4 sm:px-6">
                  <div className="mt-6">
                    <NextStepsBlock t={t} spotsCount={route.spots.length} durH={durH} durM={durM} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 스팟 상세 — 데스크톱: 우측 슬라이드 인, 모바일: 하단 시트 */}
        <HaruSpotDetailSheet
          spot={selectedSpot}
          locale={locale}
          open={selectedSpot != null}
          side={isDesktop ? "right" : "bottom"}
          onOpenChange={(open) => {
            if (!open) setSelectedSpot(null);
          }}
        />
      </div>
    </GoogleMapsProvider>
  );
}

function NextStepsBlock({
  t,
  spotsCount,
  durH,
  durM,
}: {
  t: ReturnType<typeof useTranslations<"TravelerHub">>;
  spotsCount: number;
  durH: number;
  durM: number;
}) {
  return (
    <div className="border-border/50 bg-card mt-2 max-w-2xl rounded-3xl border p-5 text-left shadow-sm sm:p-6">
      <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">{t("routeNextStepsTitle")}</p>
      <ol className="mt-4 space-y-3">
        {[1, 2, 3].map((n) => (
          <li
            key={n}
            className="border-border/40 bg-background/50 flex items-start gap-3 rounded-2xl border p-3 text-left"
          >
            <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold">
              {n}
            </span>
            <p className="text-foreground/85 text-sm leading-relaxed">{t(`routeNextStep${n}` as "routeNextStep1")}</p>
          </li>
        ))}
      </ol>
      <p className="text-muted-foreground mt-4 text-xs">
        {spotsCount} {t("routeStatsStops").toLowerCase()}
        {durH > 0 ? ` · ${t("routeHoursOnly", { h: durH })}` : ""}
        {durM > 0 ? ` ${t("routeMinutesOnly", { m: durM })}` : ""}
      </p>
    </div>
  );
}
