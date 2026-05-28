"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Bookmark,
  BookmarkCheck,
  Loader2,
  ArrowLeft,
  Share2,
  X,
  MessageCircle,
  Heart,
} from "lucide-react";
import { RouteFreePreviewSection } from "@/components/routes/route-free-preview-section";
import { HaruSpotDetailSheet } from "@/components/routes/haru-spot-detail-sheet";
import { SpotDetailContent } from "@/components/routes/spot-detail-content";
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
import { SharedByBanner } from "@/components/routes/shared-by-banner";
import {
  RouteTicketConsumeConfirmDialog,
  RouteTicketExhaustedDialog,
} from "@/components/routes/route-ticket-dialogs";
import { consumeRouteTicketAction } from "@/lib/route-access-actions.server";
import { RouteOwnerSharePanelLoader } from "@/components/routes/route-owner-share-panel-loader";
import { RouteResharePanel, RouteShareCheckingPlaceholder } from "@/components/routes/route-reshare-panel";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ROUTE_OWNER_SHARE_OPEN_EVENT } from "@/components/route-posts/playbook-unlock-sheet";
import { useToast } from "@/components/ui/toast";
import { checkRouteShareCapabilityAction } from "@/lib/route-share-capability-actions.server";
import {
  persistInviteTokenForReshare,
  readPersistedInviteToken,
  shareCapabilityMessageKey,
  withTimeout,
} from "@/lib/route-share-capability-client";
import type { RouteShareContext, ShareCapability } from "@/types/share-capability";
import { ENABLE_PAID_ROUTE_LOCK } from "@/lib/feature-flags";
import { RouteViewBlockedSection } from "@/components/routes/route-view-blocked-section";
import { RouteThanksCtaCard } from "@/components/routes/route-thanks-cta-card";
import { RouteThanksSheet } from "@/components/routes/route-thanks-sheet";
import { toAbsoluteShareUrl } from "@/lib/route-share-capability-client";

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

type BlockedMessageKey = "routeShareErrDeleted" | "routeShareErrNotPublished" | "routeShareErrBlocked";

export function RouteViewClient({
  route,
  locale,
  initialUnlocked,
  blockedMessageKey = null,
  routeIsPublic = false,
  enableThanksPayment = false,
  precomputedDirections = null,
  canSave = false,
  initialSaved = false,
  sharedBy = null,
  lockedHint = null,
  ownerGrantId = null,
  inviteAccessHint = null,
  initialShareContext = { capability: "restricted", shareUrl: null },
}: {
  route: HaruRoute;
  locale: AppLocale;
  initialUnlocked: boolean;
  blockedMessageKey?: BlockedMessageKey | null;
  routeIsPublic?: boolean;
  enableThanksPayment?: boolean;
  precomputedDirections?: RouteViewPrecomputedDirections | null;
  canSave?: boolean;
  initialSaved?: boolean;
  /** 공유 초대로 접근한 경우 오너 정보 — 상단에 SharedByBanner 노출. */
  sharedBy?: {
    user_id: string;
    display_name: string;
    avatar_url?: string | null;
  } | null;
  /** 잠금 상태일 때 클라이언트가 분기 다이얼로그를 띄워야 할 컨텍스트. */
  lockedHint?: {
    reason: "ticket-prompt" | "tickets-exhausted";
    ticketsRemaining?: number | null;
    ticketPackId?: string | null;
  } | null;
  /** 본인 owner인 경우 grant id — RouteOwnerSharePanel에 사용. */
  ownerGrantId?: string | null;
  /** 초대 링크 redeem 실패 — 결제 CTA 대신 안내. */
  inviteAccessHint?: "claimed" | "invalid" | null;
  /** SSR 공유 capability — 재공유 시 무한 로딩 방지. */
  initialShareContext?: RouteShareContext;
}) {
  const t = useTranslations("TravelerHub");
  const router = useRouter();
  const { toast } = useToast();
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [selectedSpot, setSelectedSpot] = useState<HaruSpot | null>(null);
  const [saved, setSaved] = useState(initialSaved);
  const [savePending, startSaveTransition] = useTransition();
  const [isDesktop, setIsDesktop] = useState(false);
  /** Phase 3B-2: 잠금 상태 + ticket-prompt/tickets-exhausted reason일 때 다이얼로그 노출 제어. */
  const [ticketDialog, setTicketDialog] = useState<"prompt" | "exhausted" | null>(() => {
    if (initialUnlocked || !lockedHint) return null;
    return lockedHint.reason === "ticket-prompt" ? "prompt" : "exhausted";
  });
  const [, startTicketConsume] = useTransition();
  /** 공유 sheet — owner 초대 패널 또는 재공유 패널. */
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [shareSheetMode, setShareSheetMode] = useState<"closed" | "checking" | "owner" | "reshare">("closed");
  const [shareChecking, setShareChecking] = useState(false);
  const [reshareUrl, setReshareUrl] = useState<string | null>(initialShareContext.shareUrl);
  const [thanksOpen, setThanksOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = new URLSearchParams(window.location.search).get("invite");
    persistInviteTokenForReshare(route.id, token);
  }, [route.id]);

  function showShareRestricted(cap: ShareCapability) {
    toast({
      variant: "error",
      title: t(shareCapabilityMessageKey(cap)),
    });
  }

  const openOwnerShareSheet = useCallback(() => {
    setShareSheetMode("owner");
    setShareSheetOpen(true);
  }, []);

  const runFreePublicShare = useCallback(async () => {
    const title = route.title[locale] ?? route.title.en ?? "Route";
    const rawUrl =
      initialShareContext.shareUrl ??
      (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : `/routes/${route.id}`);
    const url = toAbsoluteShareUrl(rawUrl);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        toast({ variant: "success", title: t("routeShareToastShared") });
        return;
      } catch {
        /* 사용자 취소 */
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        toast({ variant: "success", title: t("routeShareToastCopy") });
        return;
      } catch {
        toast({ variant: "error", title: t("routeOwnerShareLinkCopyErr") });
      }
    }
  }, [route.id, route.title, locale, initialShareContext.shareUrl, toast, t]);

  const handleUnlockedShareClick = useCallback(async () => {
    if (shareChecking) return;

    if (!ENABLE_PAID_ROUTE_LOCK && routeIsPublic) {
      await runFreePublicShare();
      return;
    }

    if (ownerGrantId || initialShareContext.capability === "owner_manage") {
      openOwnerShareSheet();
      return;
    }

    if (initialShareContext.capability === "can_reshare" && initialShareContext.shareUrl) {
      setReshareUrl(initialShareContext.shareUrl);
      setShareSheetMode("reshare");
      setShareSheetOpen(true);
      return;
    }

    const blocked: ShareCapability[] = ["restricted", "expired", "deleted", "private", "blocked"];
    if (blocked.includes(initialShareContext.capability)) {
      showShareRestricted(initialShareContext.capability);
      return;
    }

    setShareChecking(true);
    setShareSheetMode("checking");
    setShareSheetOpen(true);

    const inviteToken = readPersistedInviteToken(route.id);
    const result = await withTimeout(
      checkRouteShareCapabilityAction({ routeId: route.id, inviteToken }),
      2000,
      { capability: "unknown" as const, shareUrl: null },
    );

    setShareChecking(false);

    if (result.capability === "owner_manage") {
      if (ownerGrantId) {
        setShareSheetMode("owner");
      } else {
        setShareSheetOpen(false);
        setShareSheetMode("closed");
        router.refresh();
      }
      return;
    }
    if (result.capability === "can_reshare" && result.shareUrl) {
      setReshareUrl(result.shareUrl);
      setShareSheetMode("reshare");
      return;
    }

    setShareSheetOpen(false);
    setShareSheetMode("closed");
    showShareRestricted(result.capability);
  }, [
    shareChecking,
    routeIsPublic,
    runFreePublicShare,
    ownerGrantId,
    initialShareContext,
    route.id,
    openOwnerShareSheet,
    router,
    toast,
    t,
  ]);

  /** PlaybookUnlockSheet에서 dispatch한 이벤트 — 오너 패널 우선. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      void handleUnlockedShareClick();
    };
    window.addEventListener(ROUTE_OWNER_SHARE_OPEN_EVENT, handler);
    return () => window.removeEventListener(ROUTE_OWNER_SHARE_OPEN_EVENT, handler);
  }, [handleUnlockedShareClick]);

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
    void handleUnlockedShareClick();
  }

  function onConsumeTicketConfirm() {
    if (!lockedHint || lockedHint.reason !== "ticket-prompt" || !lockedHint.ticketPackId) return;
    startTicketConsume(async () => {
      const res = await consumeRouteTicketAction({
        packId: lockedHint.ticketPackId!,
        routeId: route.id,
      });
      if (res.ok) {
        setTicketDialog(null);
        // 서버에서 grant가 발급됐으므로 페이지 다시 로드 → initialUnlocked=true로 진입.
        router.refresh();
      } else {
        toast({ variant: "error", title: t("routeTicketConsumeErr") });
      }
    });
  }

  function onTicketDialogCancel() {
    setTicketDialog(null);
  }

  function onExhaustedGoPayment() {
    setTicketDialog(null);
    // 결제 시트 노출은 RouteFreePreviewSection이 담당하므로 단순히 다이얼로그를 닫는다.
    // (이미 lock 상태이므로 free preview가 보이고 그 안의 CTA로 PG 진입)
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

  // Phase 3B-2: 잠금 상태에서 ticket-prompt/tickets-exhausted 다이얼로그를
  // 무료 프리뷰 위에 띄운다. 사용자가 확정하기 전까지 결제 화면이 그대로 보이므로
  // 거절 시 원래 결제 흐름으로 자연스럽게 이어진다.
  const ticketDialogs =
    !unlocked && lockedHint ? (
      <>
        <RouteTicketConsumeConfirmDialog
          open={ticketDialog === "prompt"}
          onOpenChange={(o) => !o && setTicketDialog(null)}
          ticketsRemaining={lockedHint.ticketsRemaining ?? 0}
          onConfirm={onConsumeTicketConfirm}
          onCancel={onTicketDialogCancel}
        />
        <RouteTicketExhaustedDialog
          open={ticketDialog === "exhausted"}
          onOpenChange={(o) => !o && setTicketDialog(null)}
          onGoPayment={onExhaustedGoPayment}
        />
      </>
    ) : null;

  if (blockedMessageKey) {
    return <RouteViewBlockedSection route={route} locale={locale} messageKey={blockedMessageKey} />;
  }

  if (!unlocked) {
    return (
      <>
        <RouteFreePreviewSection
          route={route}
          locale={locale}
          onUnlock={() => setUnlocked(true)}
          inviteAccessHint={inviteAccessHint}
        />
        {ticketDialogs}
      </>
    );
  }

  const haruiUserId = route.guardian.user_id ?? null;
  const routeTitle = route.title[locale] ?? route.title.en ?? "Route";

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
              {enableThanksPayment && haruiUserId ? (
                <button
                  type="button"
                  onClick={() => setThanksOpen(true)}
                  className="text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 hidden h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold transition-colors sm:flex"
                >
                  <Heart className="size-3.5" aria-hidden />
                  <span className="max-w-[5.5rem] truncate">{t("thanksCtaButton")}</span>
                </button>
              ) : null}

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
                aria-label={unlocked ? t("routeOwnerShareTitle") : "share"}
                title={unlocked ? t("routeOwnerShareTitle") : undefined}
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
                  unlocked
                    ? "text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
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

        </header>

        {sharedBy ? (
          <div className="border-b border-border/40 bg-background/95 px-3 py-2 sm:px-4">
            <SharedByBanner ownerName={sharedBy.display_name} ownerAvatarUrl={sharedBy.avatar_url} />
          </div>
        ) : null}

        {/* ── Body ── */}
        <div className="relative min-h-0 flex-1">
          {/* 데스크톱/태블릿 (md+): 좌측 레일(고정) + 상세 패널(슬라이드 in) + 지도(밀려서 좁아짐) */}
          <div className="hidden h-full md:flex">
            {/* 1. 스팟 목록 레일 — 항상 고정 */}
            <aside className="border-border/60 bg-card/30 h-full w-[320px] shrink-0 overflow-y-auto overscroll-contain border-r lg:w-[360px] xl:w-[400px]">
              <RouteSpotRailVertical
                route={route}
                locale={locale}
                selectedSpotId={selectedSpot?.id ?? null}
                onSpotClick={(s) => setSelectedSpot(s)}
              />
              <div className="space-y-4 px-3 pb-5 sm:px-4">
                {enableThanksPayment && haruiUserId ? (
                  <RouteThanksCtaCard onClick={() => setThanksOpen(true)} />
                ) : null}
                <NextStepsBlock t={t} spotsCount={route.spots.length} durH={durH} durM={durM} />
              </div>
            </aside>

            {/* 2. 상세 패널 — selectedSpot일 때만 width가 0→fixed로 확장(슬라이드 효과) */}
            <aside
              aria-hidden={!selectedSpot}
              style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
              className={cn(
                "bg-card h-full shrink-0 overflow-hidden border-r border-border/60 transition-[width] duration-[320ms]",
                selectedSpot ? "w-[380px] lg:w-[440px] xl:w-[500px]" : "w-0",
              )}
            >
              {/* 내부는 항상 fixed 폭 — 컨테이너 width 변경 시 콘텐츠가 리플로우되지 않게 */}
              <div className="h-full w-[380px] lg:w-[440px] xl:w-[500px]">
                {selectedSpot ? (
                  <SpotDetailContent
                    key={selectedSpot.id}
                    spot={selectedSpot}
                    locale={locale}
                    onClose={() => setSelectedSpot(null)}
                  />
                ) : null}
              </div>
            </aside>

            {/* 3. 지도 — 남은 공간 모두 채움 */}
            <div className="relative min-h-0 flex-1">{MapView}</div>
          </div>

          {/* 모바일 (<md): 구글 지도 스타일 — 지도 베이스 + 50% peek 패널 + 상세는 별도 풀스크린 시트 */}
          <div className="relative h-full md:hidden">
            {MapView}
            {/* peek 패널: 지도 위에 50% 높이로 항상 떠 있음. 상세가 열리면 풀스크린 시트가 위에 덮음. */}
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 z-10 flex h-[50%] flex-col overflow-hidden rounded-t-3xl border-t border-border/60 bg-card shadow-2xl",
                "pb-[env(safe-area-inset-bottom)]",
              )}
            >
              <div className="flex shrink-0 justify-center pt-2 pb-1" aria-hidden>
                <span className="bg-muted-foreground/30 h-1 w-10 rounded-full" />
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <RouteSpotRailVertical
                  route={route}
                  locale={locale}
                  selectedSpotId={null}
                  onSpotClick={(s) => setSelectedSpot(s)}
                />
                <div className="space-y-4 px-3 pb-5">
                  {enableThanksPayment && haruiUserId ? (
                    <RouteThanksCtaCard onClick={() => setThanksOpen(true)} variant="compact" />
                  ) : null}
                  <NextStepsBlock t={t} spotsCount={route.spots.length} durH={durH} durM={durM} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 스팟 상세 — 모바일 전용 fullscreen bottom sheet. 데스크톱은 좌측 인라인 패널로 처리. */}
        {!isDesktop ? (
          <HaruSpotDetailSheet
            spot={selectedSpot}
            locale={locale}
            open={selectedSpot != null}
            side="bottom"
            fullscreen
            onOpenChange={(open) => {
              if (!open) setSelectedSpot(null);
            }}
          />
        ) : null}

        {/* 공유 sheet — 오너(초대 발급) 또는 재공유(동일 URL 전달). 무한 로딩 금지. */}
        <Sheet
          open={shareSheetOpen}
          onOpenChange={(open) => {
            setShareSheetOpen(open);
            if (!open) {
              setShareSheetMode("closed");
              setShareChecking(false);
            }
          }}
        >
          <SheetContent
            side={isDesktop ? "right" : "bottom"}
            className={cn(
              "z-[80] gap-0 overflow-y-auto p-0",
              isDesktop ? "w-[440px] max-w-full" : "max-h-[88vh] rounded-t-3xl",
            )}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>
                {shareSheetMode === "reshare" ? t("routeReshareTitle") : t("routeOwnerShareTitle")}
              </SheetTitle>
              <SheetDescription>
                {shareSheetMode === "reshare" ? t("routeReshareLead") : t("routeOwnerShareLinkHint")}
              </SheetDescription>
            </SheetHeader>
            {shareSheetMode === "checking" ? <RouteShareCheckingPlaceholder /> : null}
            {shareSheetMode === "owner" && ownerGrantId ? (
              <RouteOwnerSharePanelLoader grantId={ownerGrantId} routeId={route.id} variant="sheet" />
            ) : null}
            {shareSheetMode === "reshare" && reshareUrl ? (
              <RouteResharePanel shareUrl={reshareUrl} />
            ) : null}
          </SheetContent>
        </Sheet>

        {enableThanksPayment && haruiUserId ? (
          <RouteThanksSheet
            open={thanksOpen}
            onOpenChange={setThanksOpen}
            routeId={route.id}
            haruiUserId={haruiUserId}
            haruiDisplayName={route.guardian.display_name}
            routeTitle={routeTitle}
            onShareAfterSuccess={() => {
              setThanksOpen(false);
              void handleUnlockedShareClick();
            }}
          />
        ) : null}
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
