"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { ContentPost, RouteJourneyMetadata, RouteSpot } from "@/types/domain";
import { RouteDayPreview } from "@/components/route-posts/route-day-preview";
import { RouteStickyLocalNav } from "@/components/route-posts/route-sticky-local-nav";
import { PostDetailIntroPanel } from "@/components/posts/post-detail-intro-panel";
import {
  GuardianRequestOpenTrigger,
  type GuardianRequestSheetHostProps,
} from "@/components/guardians/guardian-request-sheet";
import { GuardianSignatureQuote } from "@/components/posts/post-info-blocks";
import { useSpotGallery } from "@/hooks/use-spot-gallery";
import { buildLocalPostVisualPlan, type LocalPostVisualPlan } from "@/lib/post-local-images";
import { SpotImageCarousel } from "@/components/route-posts/spot-image-carousel";
import { SpotImageAdminDiagnostics } from "@/components/route-posts/spot-image-admin-diagnostics";
import { SpotVerificationStrip } from "@/components/route-posts/spot-verification-strip";
import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";
import {
  POST_DETAIL_PARAGRAPH_STACK,
  POST_DETAIL_PROSE_P_MAIN,
  splitPostBodyLeadRest,
  splitPostBodyParagraphs,
} from "@/lib/post-detail-body-split";
import { resolveRouteArticleRender } from "@/lib/post-structured-content";
import { RouteArticleStructuredBody } from "@/components/posts/route-article-structured-body";

// ─── Time utilities ───────────────────────────────────────────────────────────

function startHourFromTimeOfDay(tod: RouteJourneyMetadata["recommended_time_of_day"]): number {
  switch (tod) {
    case "morning":
      return 9;
    case "afternoon":
      return 13;
    case "evening":
      return 17;
    case "night":
      return 19;
    default:
      return 10;
  }
}

function fmtTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function computeSpotTimes(spots: RouteSpot[], startHour: number): string[] {
  let cursor = startHour * 60;
  return spots.map((spot) => {
    const label = fmtTime(cursor);
    cursor += (spot.stay_duration_minutes ?? 30) + (spot.next_move_minutes ?? 0);
    return label;
  });
}

function fmtDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

// ─── Spot role system ─────────────────────────────────────────────────────────

type SpotRole = "photo" | "rest" | "destination";

interface RoleConfig {
  emoji: string;
  label: string;
  badgeClass: string;
}

const ROLE_CONFIG: Record<SpotRole, RoleConfig> = {
  photo: {
    emoji: "📸",
    label: "포토스팟",
    badgeClass:
      "bg-violet-50 text-violet-700 border-violet-200/60 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-700/30",
  },
  rest: {
    emoji: "☕",
    label: "카페·휴식",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700/30",
  },
  destination: {
    emoji: "🏛",
    label: "명소",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-700/30",
  },
};

function inferSpotRole(spot: RouteSpot): SpotRole {
  const text = [spot.title, spot.place_name, spot.what_to_do, spot.theme_reason]
    .filter(Boolean)
    .join(" ");
  if (/포토|사진|뷰|전망|촬영|인생샷|갬성|뷰포인트/.test(text)) return "photo";
  if (/카페|커피|베이커리|디저트|쉬어|앉아|휴식/.test(text)) return "rest";
  return "destination";
}

// ─── Move connector (field note separator) ────────────────────────────────────

function nextModeEmoji(mode: RouteSpot["next_move_mode"]): string {
  switch (mode) {
    case "subway":
      return "🚇";
    case "bus":
      return "🚌";
    case "taxi":
      return "🚕";
    default:
      return "🚶";
  }
}

function nextModeLabel(mode: RouteSpot["next_move_mode"]): string {
  switch (mode) {
    case "subway":
      return "지하철";
    case "bus":
      return "버스";
    case "taxi":
      return "택시";
    default:
      return "도보";
  }
}

function MoveConnector({ spot }: { spot: RouteSpot }) {
  const hasData = spot.next_move_minutes != null || spot.next_move_distance_m != null;
  if (!hasData) return null;

  const emoji = nextModeEmoji(spot.next_move_mode);
  const mode = nextModeLabel(spot.next_move_mode);
  const parts = [
    spot.next_move_minutes != null ? `약 ${spot.next_move_minutes}분` : null,
    spot.next_move_distance_m != null ? fmtDistance(spot.next_move_distance_m) : null,
  ].filter(Boolean);

  return (
    <div className="mt-6 flex items-center gap-2.5" aria-hidden>
      <div className="h-px flex-1 border-t border-dashed border-border/30" />
      <span className="flex items-center gap-1.5 rounded-full border border-border/30 bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-[var(--shadow-xs)]">
        <span>{emoji}</span>
        <span>
          {mode}
          {parts.length > 0 ? <> · {parts.join(" ")}</> : null}
        </span>
      </span>
      <div className="h-px flex-1 border-t border-dashed border-border/30" />
    </div>
  );
}

// ─── Field note primitives ────────────────────────────────────────────────────

/** 기본 필드노트 섹션 — 점선 구분선 + 레이블 */
function FieldSection({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-t border-dashed border-border/25 pt-3 first:border-t-0 first:pt-0",
        className,
      )}
    >
      {label ? (
        <p className="mb-1.5 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground/70 uppercase">
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/** 포토팁·핵심 강조 — 왼쪽 액센트 라인 */
function FieldHighlight({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-t border-dashed border-border/25 pt-3 first:border-t-0 first:pt-0",
        className,
      )}
    >
      <div className="border-l-2 border-primary/40 pl-3">
        {label ? (
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.16em] text-primary/60 uppercase">
            {label}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

/** 주의/caution — 앰버 왼쪽 액센트 */
function FieldCaution({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-dashed border-border/25 pt-3 first:border-t-0 first:pt-0">
      <div className="rounded-r-lg border-l-2 border-amber-400/50 bg-amber-50/30 pl-3 pr-2 py-1 dark:bg-amber-950/15">
        <p className="mb-1 text-[10px] font-semibold tracking-[0.16em] text-amber-600/80 uppercase dark:text-amber-400/80">
          ⚠️ 주의
        </p>
        {children}
      </div>
    </div>
  );
}

/** 행동 가이드 — → bullet 목록 */
function ActionList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
          <span className="mt-0.5 shrink-0 text-[10px] font-bold text-primary/60">→</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** 긴 텍스트를 행동 항목으로 파싱 — 명확한 구분자가 있을 때만 적용 */
function parseActionItems(text: string): string[] | null {
  const byLine = text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
  if (byLine.length >= 2) return byLine;

  const bySentence = text
    .split(/(?<=[.。])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
  if (bySentence.length >= 2) return bySentence;

  return null;
}

// ─── Role-differentiated field notes ─────────────────────────────────────────

function PhotoSpotNotes({ spot }: { spot: RouteSpot }) {
  const hasPhotoTip = !!spot.photo_tip?.trim();
  const hasWhatToDo = !!spot.what_to_do?.trim();
  const hasCaution = !!spot.caution?.trim();
  const hasBody = !!spot.body?.trim();
  const hasMood = !!(spot.theme_reason ?? spot.recommend_reason)?.trim();

  if (!hasPhotoTip && !hasWhatToDo && !hasCaution && !hasBody && !hasMood) return null;

  const angleItems = hasWhatToDo ? parseActionItems(spot.what_to_do ?? "") : null;

  return (
    <div className="mt-4 space-y-3">
      {/* 포토 팁 — 포토스팟은 이게 핵심 */}
      {hasPhotoTip ? (
        <FieldHighlight label="📸 포토 팁">
          <p className="text-sm leading-relaxed text-foreground/85">{spot.photo_tip}</p>
        </FieldHighlight>
      ) : null}

      {/* 각도·구도 가이드 */}
      {hasWhatToDo ? (
        <FieldSection label="이 각도로">
          {angleItems ? (
            <ActionList items={angleItems} />
          ) : (
            <p className="text-sm leading-relaxed text-foreground/85">{spot.what_to_do}</p>
          )}
        </FieldSection>
      ) : null}

      {/* 실패 방지 */}
      {hasCaution ? (
        <FieldCaution>
          <p className="text-sm leading-relaxed text-foreground/85">{spot.caution}</p>
        </FieldCaution>
      ) : null}

      {/* 분위기 메모 */}
      {hasMood ? (
        <FieldSection>
          <p className="text-sm italic leading-relaxed text-muted-foreground">
            {spot.theme_reason ?? spot.recommend_reason}
          </p>
        </FieldSection>
      ) : null}

      {/* 상세 기록 */}
      {hasBody ? (
        <FieldSection>
          {splitPostBodyParagraphs(spot.body).map((p, i) => (
            <p key={i} className={cn("text-sm leading-relaxed text-foreground/70", i > 0 && "mt-2")}>
              {p}
            </p>
          ))}
        </FieldSection>
      ) : null}
    </div>
  );
}

function RestSpotNotes({ spot }: { spot: RouteSpot }) {
  const hasWhatToDo = !!spot.what_to_do?.trim();
  const hasBody = !!spot.body?.trim();
  const hasCaution = !!spot.caution?.trim();
  const hasMood = !!(spot.theme_reason ?? spot.recommend_reason)?.trim();

  if (!hasWhatToDo && !hasBody && !hasCaution && !hasMood) return null;

  return (
    <div className="mt-4 space-y-3">
      {/* 경험 가이드 */}
      {hasWhatToDo ? (
        <FieldHighlight label="이럴 때 좋아요">
          <p className="text-sm leading-relaxed text-foreground/85">{spot.what_to_do}</p>
        </FieldHighlight>
      ) : null}

      {/* 현장 기록 */}
      {hasBody ? (
        <FieldSection>
          {splitPostBodyParagraphs(spot.body).map((p, i) => (
            <p key={i} className={cn("text-sm leading-relaxed text-foreground/80", i > 0 && "mt-2")}>
              {p}
            </p>
          ))}
        </FieldSection>
      ) : null}

      {/* 알아두세요 */}
      {hasCaution ? (
        <FieldCaution>
          <p className="text-sm leading-relaxed text-foreground/85">{spot.caution}</p>
        </FieldCaution>
      ) : null}

      {/* 거리 분위기 */}
      {hasMood ? (
        <FieldSection>
          <p className="text-sm italic leading-relaxed text-muted-foreground">
            {spot.theme_reason ?? spot.recommend_reason}
          </p>
        </FieldSection>
      ) : null}
    </div>
  );
}

function DestinationSpotNotes({ spot }: { spot: RouteSpot }) {
  const hasWhatToDo = !!spot.what_to_do?.trim();
  const hasPhotoTip = !!spot.photo_tip?.trim();
  const hasCaution = !!spot.caution?.trim();
  const hasBody = !!spot.body?.trim();
  const moodText = (spot.theme_reason ?? spot.recommend_reason)?.trim();
  const hasMood = !!moodText;

  if (!hasWhatToDo && !hasPhotoTip && !hasCaution && !hasBody && !hasMood) return null;

  const actionItems = hasWhatToDo ? parseActionItems(spot.what_to_do ?? "") : null;

  return (
    <div className="mt-4 space-y-3">
      {/* 왜 여기냐면 — 분위기·이유 */}
      {hasMood ? (
        <FieldHighlight label="왜 여기냐면">
          <p className="text-sm leading-relaxed text-foreground/85">{moodText}</p>
        </FieldHighlight>
      ) : null}

      {/* 여기서 할 것 */}
      {hasWhatToDo ? (
        <FieldSection label="여기서 할 것">
          {actionItems ? (
            <ActionList items={actionItems} />
          ) : (
            <p className="text-sm leading-relaxed text-foreground/85">{spot.what_to_do}</p>
          )}
        </FieldSection>
      ) : null}

      {/* 현장 기록 */}
      {hasBody ? (
        <FieldSection>
          {splitPostBodyParagraphs(spot.body).map((p, i) => (
            <p key={i} className={cn("text-sm leading-relaxed text-foreground/80", i > 0 && "mt-2")}>
              {p}
            </p>
          ))}
        </FieldSection>
      ) : null}

      {/* 포토 팁 */}
      {hasPhotoTip ? (
        <FieldSection label="📸 포토 팁">
          <p className="text-sm leading-relaxed text-foreground/85">{spot.photo_tip}</p>
        </FieldSection>
      ) : null}

      {/* 현장 메모 */}
      {hasCaution ? (
        <FieldCaution>
          <p className="text-sm leading-relaxed text-foreground/85">{spot.caution}</p>
        </FieldCaution>
      ) : null}
    </div>
  );
}

function SpotFieldNotes({ spot }: { spot: RouteSpot }) {
  const role = inferSpotRole(spot);
  if (role === "photo") return <PhotoSpotNotes spot={spot} />;
  if (role === "rest") return <RestSpotNotes spot={spot} />;
  return <DestinationSpotNotes spot={spot} />;
}

// ─── Locked hint (free users) ─────────────────────────────────────────────────

function LockedFieldHint() {
  return (
    <div className="mt-4 flex items-center gap-2.5 border-t border-dashed border-border/25 pt-3">
      <Lock className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
      <p className="text-xs text-muted-foreground/70">실행 가이드 · 포토 팁 · 현장 메모 포함</p>
    </div>
  );
}

// ─── Editorial spot row ───────────────────────────────────────────────────────

function EditorialSpotRow({
  spot,
  index,
  isLast,
  time,
  post,
  visualPlan,
  isSuperAdmin,
  isFlashing,
}: {
  spot: RouteSpot;
  index: number;
  isLast: boolean;
  time: string;
  post: ContentPost;
  visualPlan: LocalPostVisualPlan;
  isSuperAdmin: boolean;
  isFlashing: boolean;
}) {
  const t = useTranslations("RoutePosts");
  const role = inferSpotRole(spot);
  const roleConf = ROLE_CONFIG[role];
  const { slides, imageQuery, naverFetchedCount, usedFallbackOnly } = useSpotGallery(spot, post, {
    plan: visualPlan,
  });

  return (
    <div id={`route-spot-${spot.id}`} className="flex gap-3 sm:gap-4">
      {/* ── Spine ── */}
      <div className="flex w-10 shrink-0 flex-col items-center sm:w-12">
        <time
          className="mb-1.5 text-[10px] font-semibold tabular-nums text-muted-foreground"
          aria-label={`${time} 출발`}
        >
          {time}
        </time>
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300",
            isFlashing
              ? "bg-primary text-primary-foreground ring-2 ring-primary/25 ring-offset-1"
              : "bg-primary/10 text-primary",
          )}
          aria-label={`스팟 ${index + 1}`}
        >
          {index + 1}
        </div>
        {!isLast && <div className="mt-2 w-px flex-1 bg-border/20" />}
      </div>

      {/* ── Content ── */}
      <div className={cn("min-w-0 flex-1", isLast ? "pb-2" : "pb-10")}>
        {/* Header: title + role badge + stay */}
        <div className="mb-3 flex flex-wrap items-start gap-x-2 gap-y-1">
          <p
            className={cn(
              "w-full text-base font-semibold leading-snug sm:w-auto sm:flex-1",
              isFlashing ? "text-primary" : "text-[var(--text-strong)]",
            )}
          >
            {spot.title ?? spot.place_name}
          </p>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              roleConf.badgeClass,
            )}
          >
            <span aria-hidden>{roleConf.emoji}</span>
            {roleConf.label}
          </span>
        </div>
        {spot.place_name && spot.place_name !== spot.title ? (
          <p className="mb-2 text-xs text-muted-foreground">{spot.place_name}</p>
        ) : null}
        {spot.stay_duration_minutes ? (
          <span className="mb-3 inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {t("stayDuration", { minutes: spot.stay_duration_minutes })}
          </span>
        ) : null}

        <SpotImageCarousel
          key={`${spot.id}-${imageQuery}-${naverFetchedCount}`}
          slides={slides}
          className="mb-4 sm:max-w-none"
        />

        {isSuperAdmin ? (
          <>
            <SpotVerificationStrip spot={spot} className="mb-3" />
            <SpotImageAdminDiagnostics
              imageQuery={imageQuery}
              naverCount={naverFetchedCount}
              slideCount={slides.length}
              usedFallbackOnly={usedFallbackOnly}
              spot={spot}
            />
          </>
        ) : null}

        {/* Short description — conversational lead */}
        {spot.short_description ? (
          <p className="mb-3 text-[15px] leading-relaxed text-foreground/80">
            {spot.short_description}
          </p>
        ) : null}

        {/* Field notes (role-aware) or locked hint */}
        {isSuperAdmin ? <SpotFieldNotes spot={spot} /> : <LockedFieldHint />}

        {/* Move connector */}
        {!isLast ? <MoveConnector spot={spot} /> : null}
      </div>
    </div>
  );
}

// ─── RoutePostDetailClient ────────────────────────────────────────────────────

export function RoutePostDetailClient({
  post,
  requestHost,
  isSuperAdmin = false,
}: {
  post: ContentPost;
  requestHost: GuardianRequestSheetHostProps;
  /** Dev/demo: 슈퍼관리자 세션이면 true — 페이월을 건너뜁니다. */
  isSuperAdmin?: boolean;
}) {
  const t = useTranslations("RoutePosts");
  const journey = post.route_journey!;
  const spots = useMemo(() => [...journey.spots].sort((a, b) => a.order - b.order), [journey.spots]);

  const triggerRef = useRef<HTMLDivElement>(null);
  const spotsEndRef = useRef<HTMLDivElement>(null);

  const [activeSpotId, setActiveSpotId] = useState<string | null>(spots[0]?.id ?? null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
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

  const visualPlan = useMemo(() => buildLocalPostVisualPlan(post), [post]);
  const { lead, rest } = useMemo(() => splitPostBodyLeadRest(post.body), [post.body]);
  const routeStructured =
    post.structured_content?.template === "route_post" ? post.structured_content : null;
  const introPrimary = routeStructured ? routeStructured.data.intro : lead;
  const routeArticleRender = useMemo(
    () => resolveRouteArticleRender(post.structured_content, rest),
    [post.structured_content, rest],
  );

  const spotTimes = useMemo(() => {
    const startHour = startHourFromTimeOfDay(journey.metadata.recommended_time_of_day);
    return computeSpotTimes(spots, startHour);
  }, [spots, journey.metadata.recommended_time_of_day]);

  const guardianSignature = routeStructured?.data.guardian_signature?.trim() ?? null;

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

      <div className="space-y-8 sm:space-y-10">
        {/* ① 하루 프리뷰 — 스티키 내비 트리거 */}
        <div ref={triggerRef}>
          <RouteDayPreview post={post} />
        </div>

        {/* ② 이 하루웨이에 대해 */}
        {introPrimary.trim() ? (
          <PostDetailIntroPanel variant="route" primary={introPrimary} secondary={null} />
        ) : null}

        {/* ③ 먼저 알고 가면 좋은 점 */}
        {post.route_highlights && post.route_highlights.length > 0 ? (
          <section className="max-w-[42rem] border-t border-border/40 pt-7 sm:pt-8">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">
              {t("insightTitle")}
            </h2>
            <ul
              className="mt-5 max-w-[38rem] space-y-3 text-[15px] leading-snug sm:text-base"
              aria-label={t("insightTitle")}
            >
              {post.route_highlights.map((line) => (
                <li key={line} className="flex gap-3">
                  <span
                    className="border-primary/35 bg-primary/6 text-primary mt-0.5 flex size-[20px] shrink-0 items-center justify-center rounded-md border"
                    aria-hidden
                  >
                    <Check className="size-3 stroke-[2.5]" />
                  </span>
                  <span className="min-w-0 text-foreground">{line}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ④ 본문 아티클 */}
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

        {/* ⑤ 에디토리얼 타임라인 */}
        <section className="max-w-[42rem] border-t border-border/40 pt-7 sm:pt-8">
          <header className="mb-7 space-y-1">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {t("routeEyebrow")}
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">
              {t("flowTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("flowSubtitle")}</p>
          </header>

          {isSuperAdmin ? (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/60 px-4 py-2.5 dark:bg-emerald-950/30">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                🛡 슈퍼관리자 — 전체 스팟 가이드 열람 중
              </span>
            </div>
          ) : null}

          <div>
            {spots.map((spot, index) => (
              <EditorialSpotRow
                key={spot.id}
                spot={spot}
                index={index}
                isLast={index === spots.length - 1}
                time={spotTimes[index] ?? ""}
                post={post}
                visualPlan={visualPlan}
                isSuperAdmin={isSuperAdmin}
                isFlashing={flashId === spot.id}
              />
            ))}
          </div>
        </section>

        {/* ⑥ 페이월 카드 */}
        {!isSuperAdmin ? (
          <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-white to-[var(--brand-primary-soft)]/30 shadow-[var(--shadow-md)]">
            <div className="px-6 pt-6 pb-5">
              <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
                {t("spotsTitle")}
              </p>
              <h3 className="mt-1.5 text-lg font-semibold text-[var(--text-strong)]">
                {t("paywallTitle")}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("paywallLead")}</p>
            </div>

            <div className="mx-6 border-t border-border/40 pt-4 pb-2">
              <p className="mb-2.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                {t("paywallIncludesLabel")}
              </p>
              <ul className="space-y-2">
                {([
                  t("paywallItem1"),
                  t("paywallItem2"),
                  t("paywallItem3"),
                  t("paywallItem4"),
                  t("paywallItem5"),
                ] as string[]).map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <span className="text-xs font-bold text-primary">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 px-6 pt-4 pb-6">
              <GuardianRequestOpenTrigger
                size="lg"
                className="w-full gap-2 rounded-xl px-5"
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
                {t("paywallCtaPrimary")}
                <span className="text-sm font-normal text-primary-foreground/70">
                  {t("paywallCtaPrimaryPrice")}
                </span>
              </GuardianRequestOpenTrigger>
              <GuardianRequestOpenTrigger
                size="default"
                variant="outline"
                className="w-full rounded-xl"
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
                {t("paywallCtaSecondary")}
              </GuardianRequestOpenTrigger>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                {t("paywallNote")}
              </p>
            </div>
          </div>
        ) : null}

        {/* ⑦ 가디언 서명 */}
        {guardianSignature ? (
          <GuardianSignatureQuote
            label={t("routeEyebrow")}
            badge={requestHost.displayName}
            className="max-w-[42rem]"
          >
            {guardianSignature}
          </GuardianSignatureQuote>
        ) : null}
      </div>

      <div ref={spotsEndRef} aria-hidden className="h-px w-full" />
    </>
  );
}
