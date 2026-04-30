"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { ContentPost, RouteSpot } from "@/types/domain";
import { RouteStickyLocalNav } from "@/components/route-posts/route-sticky-local-nav";
import { RouteSummaryCard } from "@/components/route-posts/route-summary-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PostDetailIntroPanel } from "@/components/posts/post-detail-intro-panel";
import { GuardianRequestIntakeBullets } from "@/components/guardians/guardian-request-intake-bullets";
import { GuardianRequestOpenTrigger, type GuardianRequestSheetHostProps } from "@/components/guardians/guardian-request-sheet";
import { getSpotDisplayImageAlt, getSpotDisplayImageUrl } from "@/lib/content-post-route";
import { buildLocalPostVisualPlan, type LocalPostVisualPlan } from "@/lib/post-local-images";
import { routeSpotImageCoverClass } from "@/lib/post-image-crop";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  POST_DETAIL_PARAGRAPH_STACK,
  POST_DETAIL_PARAGRAPH_STACK_COMPACT,
  POST_DETAIL_PROSE_P_COMPACT,
  POST_DETAIL_PROSE_P_MAIN,
  POST_DETAIL_PROSE_P_SPOT,
  splitPostBodyLeadRest,
  splitPostBodyParagraphs,
} from "@/lib/post-detail-body-split";
import { splitSpotBodyAndNextCue } from "@/lib/post-detail-structured-parse";
import { resolveRouteArticleRender } from "@/lib/post-structured-content";
import { RouteArticleStructuredBody } from "@/components/posts/route-article-structured-body";
import {
  RouteSpotMetaStayRow,
  RouteSpotNextFlowRow,
  RouteSpotPhotoTipNote,
  RouteSpotReasonBlock,
  RouteSpotWarningNote,
} from "@/components/posts/post-info-blocks";

/** 하루 흐름 — 지도 대신 세로 타임라인으로 동선 순서 표시 */
function HaruFlowTimeline({
  spots,
  activeSpotId,
  onSpotClick,
}: {
  spots: RouteSpot[];
  activeSpotId: string | null;
  onSpotClick: (id: string) => void;
}) {
  const t = useTranslations("RoutePosts");
  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-[var(--shadow-sm)]">
      <div className="border-b border-border/60 bg-white/90 px-5 pt-4 pb-3.5 sm:px-6 dark:bg-card/80">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary">{t("routeEyebrow")}</p>
        <h2 className="mt-0.5 text-lg font-semibold text-[var(--text-strong)]">{t("flowTitle")}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("flowSubtitle")}</p>
      </div>
      <div className="px-4 py-3 sm:px-5 sm:py-4">
        {spots.map((spot, index) => {
          const isActive = activeSpotId === spot.id;
          const isLast = index === spots.length - 1;
          const hasNextMove = !isLast && (spot.next_move_minutes != null || spot.next_move_distance_m != null);
          const nextModeLabel =
            spot.next_move_mode === "subway" ? "지하철" :
            spot.next_move_mode === "bus" ? "버스" :
            spot.next_move_mode === "taxi" ? "택시" : "도보";
          const nextMoveText = [
            spot.next_move_minutes != null ? `${spot.next_move_minutes}분` : null,
            spot.next_move_distance_m != null
              ? spot.next_move_distance_m >= 1000
                ? `${(spot.next_move_distance_m / 1000).toFixed(1)}km`
                : `${spot.next_move_distance_m}m`
              : null,
          ].filter(Boolean).join(" · ");
          return (
            <div key={spot.id} className="flex gap-3">
              {/* Spine */}
              <div className="flex shrink-0 flex-col items-center">
                <button
                  type="button"
                  onClick={() => onSpotClick(spot.id)}
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/25 ring-offset-1"
                      : "bg-primary/10 text-primary hover:bg-primary/20",
                  )}
                  aria-label={`스팟 ${index + 1}: ${spot.title ?? spot.place_name}`}
                >
                  {index + 1}
                </button>
                {!isLast && <div className="my-1 min-h-6 w-px flex-1 bg-border/50" />}
              </div>
              {/* Content + move connector */}
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onSpotClick(spot.id)}
                  className={cn(
                    "group w-full rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                    isActive
                      ? "border-primary/20 bg-primary/8"
                      : "border-transparent hover:border-border/50 hover:bg-muted/40",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold leading-snug text-[var(--text-strong)]">
                      {spot.title ?? spot.place_name}
                    </p>
                    <ChevronRight
                      className={cn(
                        "size-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5",
                        isActive && "text-primary/60",
                      )}
                      aria-hidden
                    />
                  </div>
                  {spot.place_name && spot.place_name !== spot.title ? (
                    <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                      {spot.place_name}
                    </p>
                  ) : spot.short_description ? (
                    <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                      {spot.short_description}
                    </p>
                  ) : null}
                  {spot.stay_duration_minutes ? (
                    <span className="mt-1.5 inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      약 {spot.stay_duration_minutes}분 체류
                    </span>
                  ) : null}
                </button>
                {/* Next-move connector pill */}
                {hasNextMove ? (
                  <div className="my-1.5 ml-3 flex items-center gap-1.5">
                    <span className="text-muted-foreground/50 text-[10px]">↓</span>
                    <span className="rounded-full border border-border/40 bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {nextModeLabel} {nextMoveText}
                    </span>
                  </div>
                ) : !isLast ? (
                  <div className="my-1.5 ml-3">
                    <span className="text-muted-foreground/30 text-[10px]">↓</span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SpotDetailBody({
  spot,
  post,
  visualPlan,
  isLast,
  onNext,
  layout,
}: {
  spot: RouteSpot;
  post: ContentPost;
  visualPlan: LocalPostVisualPlan;
  isLast: boolean;
  onNext?: () => void;
  /** `embedded`: 스팟 카드 헤더 아래 본문만. `sheet`: 바텀시트 전용(제목은 시트 헤더). */
  layout: "embedded" | "sheet";
}) {
  const t = useTranslations("RoutePosts");
  const img = getSpotDisplayImageUrl(spot, post, { plan: visualPlan });
  const imgAlt = spot.image_alt ?? getSpotDisplayImageAlt(spot, post, { plan: visualPlan });
  const { main: bodyMain } = splitSpotBodyAndNextCue(spot.body ?? "");

  // Build structured next-move text from fields (preferred) or fall back to none
  const nextModeLabel =
    spot.next_move_mode === "subway" ? "지하철" :
    spot.next_move_mode === "bus" ? "버스" :
    spot.next_move_mode === "taxi" ? "택시" : "도보";
  const nextMoveDetail = [
    spot.next_move_minutes != null ? `약 ${spot.next_move_minutes}분` : null,
    spot.next_move_distance_m != null
      ? spot.next_move_distance_m >= 1000
        ? `${(spot.next_move_distance_m / 1000).toFixed(1)}km`
        : `${spot.next_move_distance_m}m`
      : null,
  ].filter(Boolean).join(" · ");
  const hasStructuredNextMove = !isLast && (spot.next_move_minutes != null || spot.next_move_distance_m != null);

  const photoInner = spot.photo_tip ? (
    <RouteSpotPhotoTipNote label={t("photoTip")}>
      <div className={POST_DETAIL_PARAGRAPH_STACK_COMPACT}>
        {splitPostBodyParagraphs(spot.photo_tip).map((block, i) => (
          <p key={i} className={POST_DETAIL_PROSE_P_COMPACT}>
            {block}
          </p>
        ))}
      </div>
    </RouteSpotPhotoTipNote>
  ) : null;

  const cautionInner = spot.caution ? (
    <RouteSpotWarningNote label={t("caution")}>
      <div className={POST_DETAIL_PARAGRAPH_STACK_COMPACT}>
        {splitPostBodyParagraphs(spot.caution).map((block, i) => (
          <p key={i} className={POST_DETAIL_PROSE_P_COMPACT}>
            {block}
          </p>
        ))}
      </div>
    </RouteSpotWarningNote>
  ) : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="border-border/60 relative aspect-[16/10] overflow-hidden rounded-xl border sm:rounded-2xl">
        <Image src={img} alt={imgAlt} fill className={routeSpotImageCoverClass(post)} sizes="(max-width:768px) 100vw, 640px" />
      </div>

      {layout === "sheet" ? (
        <div className="space-y-4">
          <p className="text-muted-foreground text-xs font-medium">{spot.place_name}</p>
          {spot.short_description ? (
            <>
              <p className="text-primary text-[10px] font-bold tracking-wide uppercase">{t("spotCoreEyebrow")}</p>
              <div className={POST_DETAIL_PARAGRAPH_STACK_COMPACT}>
                {splitPostBodyParagraphs(spot.short_description).map((block, i) => (
                  <p key={i} className="text-foreground text-sm font-medium leading-relaxed whitespace-pre-line">
                    {block}
                  </p>
                ))}
              </div>
            </>
          ) : null}
          {spot.theme_reason ? (
            <div className="rounded-xl bg-primary/5 px-3.5 py-3 border border-primary/10">
              <p className="text-primary text-[10px] font-bold tracking-wide uppercase mb-1.5">{t("themeReasonLabel")}</p>
              <p className="text-sm leading-relaxed text-foreground/80">{spot.theme_reason}</p>
            </div>
          ) : spot.recommend_reason ? (
            <RouteSpotReasonBlock label={t("whyRecommend")}>
              <div className={POST_DETAIL_PARAGRAPH_STACK_COMPACT}>
                {splitPostBodyParagraphs(spot.recommend_reason).map((block, i) => (
                  <p key={i} className="text-sm leading-relaxed whitespace-pre-line">
                    {block}
                  </p>
                ))}
              </div>
            </RouteSpotReasonBlock>
          ) : null}
          {spot.what_to_do ? (
            <div>
              <p className="text-primary text-[10px] font-bold tracking-wide uppercase mb-1.5">{t("whatToDoLabel")}</p>
              <p className="text-sm leading-relaxed text-foreground">{spot.what_to_do}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {bodyMain ? (
        <div className={POST_DETAIL_PARAGRAPH_STACK}>
          {splitPostBodyParagraphs(bodyMain).map((para, i) => (
            <p key={i} className={POST_DETAIL_PROSE_P_SPOT}>
              {para}
            </p>
          ))}
        </div>
      ) : null}

      <div className="space-y-3 sm:space-y-4">
        {photoInner}
        {cautionInner}
      </div>

      {/* Structured next-move row (preferred over parsed body text) */}
      {hasStructuredNextMove ? (
        <RouteSpotNextFlowRow
          text={`${nextModeLabel} ${nextMoveDetail}`}
          label={t("spotNextFlowEyebrow")}
        />
      ) : null}

      <RouteSpotMetaStayRow>{t("stayDuration", { minutes: spot.stay_duration_minutes })}</RouteSpotMetaStayRow>

      {!isLast && onNext ? (
        <Button type="button" variant="outline" className="w-full gap-2 rounded-xl" onClick={onNext}>
          {t("ctaNextSpot")}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}

export function RoutePostDetailClient({
  post,
  requestHost,
}: {
  post: ContentPost;
  requestHost: GuardianRequestSheetHostProps;
}) {
  const t = useTranslations("RoutePosts");
  const tReq = useTranslations("GuardianRequest");
  const journey = post.route_journey!;
  const meta = journey.metadata;
  const spots = useMemo(() => [...journey.spots].sort((a, b) => a.order - b.order), [journey.spots]);

  const triggerRef = useRef<HTMLDivElement>(null);
  const spotsEndRef = useRef<HTMLDivElement>(null);

  const [activeSpotId, setActiveSpotId] = useState<string | null>(spots[0]?.id ?? null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showStickyNav, setShowStickyNav] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const fn = () => setIsMobile(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const navigateToSpotSection = useCallback((id: string) => {
    setActiveSpotId(id);
    document.getElementById(`route-spot-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setFlashId(id);
    window.setTimeout(() => setFlashId(null), 2200);
  }, []);

  function goNextFrom(id: string) {
    const idx = spots.findIndex((s) => s.id === id);
    const next = spots[idx + 1];
    if (!next) return;
    navigateToSpotSection(next.id);
    if (isMobile) setSheetOpen(true);
  }

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const mapEl = triggerRef.current;
      const endEl = spotsEndRef.current;
      if (!mapEl || !endEl) return;

      const mapBottom = mapEl.getBoundingClientRect().bottom;
      const endTop = endEl.getBoundingClientRect().top;
      const stickyOn = mapBottom < 0 && endTop > 0;
      setShowStickyNav((prev) => (prev === stickyOn ? prev : stickyOn));

      const headerH = window.innerWidth >= 640 ? 64 : 56;
      const stickyH = stickyOn ? (isMobile ? 48 : 56) : 0;
      const probeY = headerH + stickyH + 20;

      let nextActive: string | null = spots[0]?.id ?? null;
      for (const spot of spots) {
        const el = document.getElementById(`route-spot-${spot.id}`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= probeY) nextActive = spot.id;
      }
      setActiveSpotId((prev) => (prev === nextActive ? prev : nextActive));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [spots, isMobile]);

  // triggerRef → mapCardRef alias (scroll trigger for sticky nav)

  const selectedSpot = spots.find((s) => s.id === activeSpotId) ?? null;

  const visualPlan = useMemo(() => buildLocalPostVisualPlan(post), [post]);
  const { lead, rest } = useMemo(() => splitPostBodyLeadRest(post.body), [post.body]);
  const routeStructured =
    post.structured_content?.template === "route_post" ? post.structured_content : null;
  const introPrimary = routeStructured ? routeStructured.data.intro : lead;
  const routeArticleRender = useMemo(
    () => resolveRouteArticleRender(post.structured_content, rest),
    [post.structured_content, rest],
  );
  const goodForLine = useMemo(
    () => meta.recommended_traveler_types.filter(Boolean).join(" · ") || null,
    [meta.recommended_traveler_types],
  );

  return (
    <>
      {showStickyNav && spots.length > 0 ? (
        <RouteStickyLocalNav
          spots={spots}
          activeSpotId={activeSpotId}
          onSpotNavigate={(id) => navigateToSpotSection(id)}
          isMobile={isMobile}
        />
      ) : null}

      <div className="space-y-5 sm:space-y-6">
        {/* ① 하루 흐름 — Hero 바로 아래 첫 번째 카드 */}
        <div ref={triggerRef}>
          <HaruFlowTimeline
            spots={spots}
            activeSpotId={activeSpotId}
            onSpotClick={(id) => {
              navigateToSpotSection(id);
              if (isMobile) setSheetOpen(true);
            }}
          />
        </div>

        {/* ② 한눈에 보는 하루 */}
        <RouteSummaryCard meta={meta} spotCount={spots.length} goodForLine={goodForLine} />

        {/* ③ 이 하루웨이에 대해 — 인트로 리드가 있을 때만 표시 */}
        {introPrimary.trim() ? (
          <PostDetailIntroPanel
            variant="route"
            primary={introPrimary}
            secondary={null}
          />
        ) : null}

        {/* ④ 먼저 알고 가면 좋은 점 */}
        {post.route_highlights && post.route_highlights.length > 0 ? (
          <section className="rounded-2xl border border-border/60 bg-white/90 p-6 shadow-[var(--shadow-sm)]">
            <h2 className="text-text-strong text-lg font-semibold">{t("insightTitle")}</h2>
            <ul className="text-muted-foreground mt-4 list-inside list-disc space-y-3 text-sm leading-relaxed sm:space-y-3.5">
              {post.route_highlights.map((line) => (
                <li key={line} className="marker:text-primary">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {routeArticleRender.mode === "blocks" || rest.trim() ? (
          routeArticleRender.mode === "blocks" ? (
            <RouteArticleStructuredBody parsed={routeArticleRender.data} />
          ) : rest.trim() ? (
            <div className={POST_DETAIL_PARAGRAPH_STACK}>
              {splitPostBodyParagraphs(rest).map((para, i) => (
                <p key={i} className={POST_DETAIL_PROSE_P_MAIN}>
                  {para}
                </p>
              ))}
            </div>
          ) : null
        ) : null}
      </div>

      <section className="mt-12 space-y-7 sm:space-y-8">
        <h2 className="text-text-strong text-lg font-semibold">{t("spotsTitle")}</h2>
        {spots.map((spot, index) => {
          const isLast = index === spots.length - 1;
          return (
            <article
              key={spot.id}
              id={`route-spot-${spot.id}`}
              className={cn(
                "rounded-2xl border border-border/60 bg-white/95 p-5 shadow-[var(--shadow-sm)] transition-[box-shadow] sm:p-7 sm:pb-8",
                showStickyNav ? "scroll-mt-36 sm:scroll-mt-40" : "scroll-mt-28",
                flashId === spot.id ? "ring-primary ring-2 ring-offset-2" : "",
                activeSpotId === spot.id && showStickyNav ? "border-primary/25" : "",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    activeSpotId === spot.id && showStickyNav
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/12 text-primary",
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-3 sm:space-y-4">
                  <h3 className="text-text-strong text-xl font-semibold">{spot.title}</h3>
                  <p className="text-muted-foreground text-sm font-medium">{spot.place_name}</p>
                  {spot.address_line ? (
                    <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line">{spot.address_line}</p>
                  ) : null}
                  {spot.short_description ? (
                    <>
                      <p className="text-primary text-[10px] font-bold tracking-wide uppercase">{t("spotCoreEyebrow")}</p>
                      <div className={POST_DETAIL_PARAGRAPH_STACK_COMPACT}>
                        {splitPostBodyParagraphs(spot.short_description).map((block, i) => (
                          <p key={i} className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                            {block}
                          </p>
                        ))}
                      </div>
                    </>
                  ) : null}
                  {spot.recommend_reason ? (
                    <RouteSpotReasonBlock label={t("whyRecommend")}>
                      <div className={POST_DETAIL_PARAGRAPH_STACK_COMPACT}>
                        {splitPostBodyParagraphs(spot.recommend_reason).map((block, i) => (
                          <p key={i} className="text-sm leading-relaxed whitespace-pre-line">
                            {block}
                          </p>
                        ))}
                      </div>
                    </RouteSpotReasonBlock>
                  ) : null}
                  <Button
                    type="button"
                    variant="link"
                    className="text-primary mt-2 h-auto p-0 text-sm font-semibold lg:hidden"
                    onClick={() => {
                      setActiveSpotId(spot.id);
                      setSheetOpen(true);
                    }}
                  >
                    {t("ctaViewSpot")}
                  </Button>
                </div>
              </div>
              <div className="mt-6">
                <SpotDetailBody
                  spot={spot}
                  post={post}
                  visualPlan={visualPlan}
                  isLast={isLast}
                  layout="embedded"
                  onNext={isLast ? undefined : () => goNextFrom(spot.id)}
                />
              </div>
              {!isLast ? (
                <p className="text-primary mt-6 text-center text-xs font-semibold tracking-wide uppercase">{t("nextCue")}</p>
              ) : null}
            </article>
          );
        })}
      </section>

      <div ref={spotsEndRef} aria-hidden className="h-px w-full" />

      <div className="border-border/50 mt-12 rounded-2xl border bg-gradient-to-br from-[var(--brand-primary-soft)] to-white p-8 text-center shadow-[var(--shadow-sm)]">
        <p className="text-text-strong text-lg font-semibold">{t("bottomCtaTitle")}</p>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-relaxed">{t("bottomCtaLead")}</p>
        <GuardianRequestIntakeBullets className="mx-auto mt-4 max-w-md text-left" />
        <GuardianRequestOpenTrigger
          size="lg"
          className="mt-6 rounded-2xl px-10"
          openDetail={{
            guardianUserId: requestHost.guardianUserId,
            displayName: requestHost.displayName,
            headline: requestHost.headline,
            avatarUrl: requestHost.avatarUrl,
            suggestedRegionSlug: requestHost.suggestedRegionSlug ?? null,
            postId: post.id,
            postTitle: post.title,
          }}
        >
          {tReq("openCta")}
        </GuardianRequestOpenTrigger>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] rounded-t-3xl px-4 pt-2 pb-6" showCloseButton>
          {selectedSpot ? (
            <>
              <SheetHeader className="px-0 text-left">
                <SheetTitle className="text-left text-base">{selectedSpot.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-2 max-h-[calc(88vh-5rem)] overflow-y-auto pr-1">
                <SpotDetailBody
                  spot={selectedSpot}
                  post={post}
                  visualPlan={visualPlan}
                  isLast={selectedSpot.id === spots[spots.length - 1]?.id}
                  layout="sheet"
                  onNext={() => goNextFrom(selectedSpot.id)}
                />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
