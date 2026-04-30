"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { ContentPost, NaverPrimaryPlace, RouteJourneyMetadata, RouteSpot } from "@/types/domain";
import { RouteDayPreview } from "@/components/route-posts/route-day-preview";
import { RouteStickyLocalNav } from "@/components/route-posts/route-sticky-local-nav";
import { type GuardianRequestSheetHostProps } from "@/components/guardians/guardian-request-sheet";
import { GuardianSignatureQuote } from "@/components/posts/post-info-blocks";
import { PlaybookUnlockSheet } from "@/components/route-posts/playbook-unlock-sheet";
import { useSpotGallery } from "@/hooks/use-spot-gallery";
import { buildLocalPostVisualPlan, type LocalPostVisualPlan } from "@/lib/post-local-images";
import { SpotImageCarousel } from "@/components/route-posts/spot-image-carousel";
import { SpotImageAdminDiagnostics } from "@/components/route-posts/spot-image-admin-diagnostics";
import { SpotVerificationStrip } from "@/components/route-posts/spot-verification-strip";
import { cn } from "@/lib/utils";
import type { FreeArchetype } from "@/lib/route-free-classification";
import { inferFreeArchetype } from "@/lib/route-free-classification";
import { Button } from "@/components/ui/button";
import { ChevronDown, Lock } from "lucide-react";
import {
  POST_DETAIL_PARAGRAPH_STACK,
  POST_DETAIL_PROSE_P_MAIN,
  splitPostBodyLeadRest,
  splitPostBodyParagraphs,
} from "@/lib/post-detail-body-split";
import { resolveRouteArticleRender } from "@/lib/post-structured-content";
import { RouteArticleStructuredBody } from "@/components/posts/route-article-structured-body";
import {
  atmospherePlaybookTitle,
  collapsedSituationLine,
  freeTierMoodTitle,
  premiumSpotAddressLine,
  premiumSpotPlaceTitle,
} from "@/lib/route-playbook-labels";

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

type SpotRole = FreeArchetype;

interface RoleConfig {
  emoji: string;
  label: string;
  badgeClass: string;
}

const ROLE_CONFIG: Record<SpotRole, RoleConfig> = {
  prep: {
    emoji: "🧭",
    label: "준비형",
    badgeClass:
      "bg-sky-50 text-sky-800 border-sky-200/60 dark:bg-sky-950/30 dark:text-sky-200 dark:border-sky-700/30",
  },
  photo: {
    emoji: "📸",
    label: "포토형",
    badgeClass:
      "bg-violet-50 text-violet-700 border-violet-200/60 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-700/30",
  },
  rest: {
    emoji: "🌳",
    label: "휴식형",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700/30",
  },
  destination: {
    emoji: "🏛",
    label: "목적지형",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-700/30",
  },
};

function inferSpotRole(spot: RouteSpot): SpotRole {
  return inferFreeArchetype(spot);
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
    <div className="mt-4 flex items-stretch gap-0" role="separator" aria-label="다음 스팟으로 이동">
      <div className="text-primary/35 flex w-10 shrink-0 flex-col items-center sm:w-12">
        <div className="min-h-3 w-px flex-1 bg-border/25" />
      </div>
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-center gap-2.5">
          <div className="h-px flex-1 border-t border-dashed border-border/35" />
          <span className="flex items-center gap-1.5 rounded-full border border-border/30 bg-background px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-[var(--shadow-xs)]">
            <span aria-hidden>{emoji}</span>
            <span>
              {mode}
              {parts.length > 0 ? <> · {parts.join(" ")}</> : null}
            </span>
          </span>
          <div className="h-px flex-1 border-t border-dashed border-border/35" />
        </div>
      </div>
    </div>
  );
}

function FreePlaybookImageTeaser({ message }: { message: string }) {
  return (
    <div
      className="relative flex aspect-video w-full items-end justify-center overflow-hidden rounded-lg border border-border/35 bg-gradient-to-b from-muted/45 via-primary/[0.05] to-muted/55 px-3 pb-3 pt-10"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_50%,hsl(var(--background)/0.55))]" />
      <p className="text-muted-foreground relative z-[1] text-center text-[10px] font-medium leading-snug">{message}</p>
    </div>
  );
}

/** 무료 티저 — 실사 이미지는 블러만 공개(실명·주소와 분리) */
function FreePlaybookBlurredHero({ imageUrl, fallbackMessage }: { imageUrl: string | undefined; fallbackMessage: string }) {
  if (!imageUrl?.trim()) {
    return <FreePlaybookImageTeaser message={fallbackMessage} />;
  }
  return (
    <div
      className="border-border/35 relative aspect-video w-full overflow-hidden rounded-lg border"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 외부 CDN URL 가변 */}
      <img
        src={imageUrl}
        alt=""
        className="h-full w-full scale-[1.12] object-cover blur-2xl saturate-[0.85]"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-background/35 to-background/60" />
    </div>
  );
}

function LegFromPrevious({ text }: { text: string | undefined }) {
  if (!text?.trim()) return null;
  return (
    <p className="text-foreground/90 mb-4 rounded-lg border border-border/35 bg-muted/20 px-3 py-2.5 text-[13px] leading-snug">
      <span className="text-muted-foreground mr-1 font-semibold">🧭 이동</span>
      {text.trim()}
    </p>
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

// ─── Editorial spot — 접힘=무료 플로우 / 펼침=유료 플레이북 ────────────────────

function EditorialSpotRow({
  spot,
  index,
  isLast,
  time,
  post,
  visualPlan,
  hasPlaybookPremium,
  showAdminDebug,
  isFlashing,
  onOpenPayDrawer,
}: {
  spot: RouteSpot;
  index: number;
  isLast: boolean;
  time: string;
  post: ContentPost;
  visualPlan: LocalPostVisualPlan;
  /** 결제·구독 등 오픈 시 true — TODO: 서버에서 실제 구매 여부 연동 */
  hasPlaybookPremium: boolean;
  showAdminDebug: boolean;
  isFlashing: boolean;
  onOpenPayDrawer: () => void;
}) {
  const t = useTranslations("RoutePosts");
  const role = inferSpotRole(spot);
  const roleConf = ROLE_CONFIG[role];
  const freeTitle = freeTierMoodTitle(spot);
  const arch = inferFreeArchetype(spot);
  const moodEyebrow = spot.display_mood_title?.trim() || atmospherePlaybookTitle(spot);
  const situationPremium = spot.display_mood_subtitle?.trim() || collapsedSituationLine(spot);
  const placeTitle = premiumSpotPlaceTitle(spot);
  const addressFallback = premiumSpotAddressLine(spot);

  const {
    slides,
    imageQuery,
    naverFetchedCount,
    usedFallbackOnly,
    primaryPlace,
    placeSimilarityScore,
    searchQueryUsedForResolve,
    imageQueriesTried,
    usedBroadFallback,
    excludedApprox,
    pipelineDone,
  } = useSpotGallery(spot, post, {
    plan: visualPlan,
    fetchRemote: true,
  });

  const heroSlides = slides.length ? slides.slice(0, 1) : slides;
  const gallerySlides = slides;
  const blurredHeroUrl = heroSlides[0]?.tryUrls?.[0];

  const [expanded, setExpanded] = useState(false);

  const addressLine =
    primaryPlace?.roadAddress?.trim() ||
    primaryPlace?.address?.trim() ||
    addressFallback;

  const carouselKey = `${spot.id}-${pipelineDone ? "r" : "l"}-${primaryPlace?.title ?? "np"}-${naverFetchedCount}`;

  const teaserLines = [
    t("playbookTeaserPlace"),
    t("playbookTeaserGallery"),
    t("playbookTeaserMove"),
    t("playbookTeaserSeat"),
  ];

  const adminBlock = showAdminDebug && hasPlaybookPremium ? (
    <AdminSpotDebug
      spot={spot}
      imageQuery={imageQuery}
      naverFetchedCount={naverFetchedCount}
      slidesLength={slides.length}
      usedFallbackOnly={usedFallbackOnly}
      usedBroadFallback={usedBroadFallback}
      primaryPlace={primaryPlace}
      placeSimilarityScore={placeSimilarityScore}
      searchQueryUsedForResolve={searchQueryUsedForResolve}
      imageQueriesTried={imageQueriesTried}
      excludedApprox={excludedApprox}
      carouselKey={carouselKey}
    />
  ) : null;

  const spine = (
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
      {!isLast ? <div className="mt-2 w-px flex-1 bg-border/30" aria-hidden /> : null}
    </div>
  );

  /** 무료 — 완전 티저만: 실사진·실명·주소 미노출, 네이버 호출 없음, 펼침 불가 */
  if (!hasPlaybookPremium) {
    return (
      <div id={`route-spot-${spot.id}`} className="flex gap-3 sm:gap-4">
        {spine}
        <div className={cn("min-w-0 flex-1", isLast ? "pb-2" : "pb-6")}>
          <div className="border-border/40 bg-card/80 rounded-lg border px-3 py-2.5 shadow-sm sm:px-3.5 sm:py-3">
            <div className="flex flex-wrap items-start gap-2">
              <p
                className={cn(
                  "text-[var(--text-strong)] min-w-0 flex-1 text-[14px] font-semibold leading-snug tracking-tight",
                  isFlashing && "text-primary",
                )}
              >
                {freeTitle}
              </p>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  roleConf.badgeClass,
                )}
              >
                <span aria-hidden>{roleConf.emoji}</span>
                {roleConf.label}
              </span>
            </div>
            {spot.stay_duration_minutes ? (
              <p className="text-muted-foreground mt-1 text-[10px] font-medium">
                {t("stayDuration", { minutes: spot.stay_duration_minutes })}
              </p>
            ) : null}

            <div className="mt-2.5">
              <FreePlaybookBlurredHero imageUrl={blurredHeroUrl} fallbackMessage={t("playbookVisualLocked")} />
            </div>

            <p className="text-foreground/85 mt-2.5 text-[13px] leading-snug line-clamp-2">
              {arch === "prep"
                ? t("freeArchetypeTeaser.prep")
                : arch === "photo"
                  ? t("freeArchetypeTeaser.photo")
                  : arch === "rest"
                    ? t("freeArchetypeTeaser.rest")
                    : t("freeArchetypeTeaser.destination")}
            </p>

            <Button
              type="button"
              variant="secondary"
              className="text-foreground/90 mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border-border/50 text-[13px] font-semibold shadow-none"
              onClick={onOpenPayDrawer}
            >
              <Lock className="size-3.5 shrink-0 opacity-80" aria-hidden />
              {t("playbookCtaView")}
            </Button>
          </div>
          {!isLast ? <MoveConnector spot={spot} /> : null}
        </div>
      </div>
    );
  }

  /** 유료 — 기본 접힘; 펼침에서만 실명·주소·풀 갤러리·이동 메모·필드노트 */
  return (
    <div id={`route-spot-${spot.id}`} className="flex gap-3 sm:gap-4">
      {spine}
      <div className={cn("min-w-0 flex-1", isLast ? "pb-2" : "pb-10")}>
        <div className="border-border/50 overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-xs)]">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="hover:bg-muted/35 flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors sm:px-5 sm:py-4"
            aria-expanded={expanded}
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <p
                className={cn(
                  "text-[var(--text-strong)] text-[15px] font-semibold leading-snug tracking-tight",
                  isFlashing && "text-primary",
                )}
              >
                {moodEyebrow}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    roleConf.badgeClass,
                  )}
                >
                  <span aria-hidden>{roleConf.emoji}</span>
                  {roleConf.label}
                </span>
                {spot.stay_duration_minutes ? (
                  <span className="text-muted-foreground text-[10px] font-medium">
                    {t("stayDuration", { minutes: spot.stay_duration_minutes })}
                  </span>
                ) : null}
              </div>
            </div>
            <ChevronDown
              className={cn(
                "text-muted-foreground mt-0.5 size-5 shrink-0 transition-transform duration-200",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          <div className="border-border/45 border-t px-4 pb-4 sm:px-5">
            {!expanded ? (
              <>
                <SpotImageCarousel key={`fold-${carouselKey}`} slides={heroSlides} className="pt-3 sm:max-w-none" />
                {situationPremium ? (
                  <p className="text-foreground/80 mt-3 text-sm leading-relaxed">&ldquo;{situationPremium}&rdquo;</p>
                ) : null}
                <ul className="text-muted-foreground mt-3 space-y-1 text-[11px] leading-relaxed">
                  {teaserLines.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="shrink-0 opacity-70">·</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground mt-3 text-[10px] leading-snug">{t("playbookFoldHint")}</p>
              </>
            ) : (
              <>
                {spot.leg_from_previous?.trim() ? <LegFromPrevious text={spot.leg_from_previous} /> : null}
                <p className="text-muted-foreground text-[11px] font-medium">{moodEyebrow}</p>
                <h3 className="text-[var(--text-strong)] mt-1 text-xl font-bold tracking-tight">
                  {placeTitle || moodEyebrow}
                </h3>
                {addressLine ? (
                  <p className="text-muted-foreground mt-1 text-sm leading-snug">{addressLine}</p>
                ) : null}
                <SpotImageCarousel key={`full-${carouselKey}`} slides={gallerySlides} className="mt-4 sm:max-w-none" />
                {spot.short_description ? (
                  <p className="text-foreground/85 mt-4 text-[15px] leading-relaxed">{spot.short_description}</p>
                ) : null}
                <SpotFieldNotes spot={spot} />
              </>
            )}
          </div>
        </div>

        {adminBlock}
        {!isLast ? <MoveConnector spot={spot} /> : null}
      </div>
    </div>
  );
}

function AdminSpotDebug({
  spot,
  imageQuery,
  naverFetchedCount,
  slidesLength,
  usedFallbackOnly,
  usedBroadFallback,
  primaryPlace,
  placeSimilarityScore,
  searchQueryUsedForResolve,
  imageQueriesTried,
  excludedApprox,
  carouselKey,
}: {
  spot: RouteSpot;
  imageQuery: string;
  naverFetchedCount: number;
  slidesLength: number;
  usedFallbackOnly: boolean;
  usedBroadFallback: boolean;
  primaryPlace: NaverPrimaryPlace | null;
  placeSimilarityScore: number | null;
  searchQueryUsedForResolve: string;
  imageQueriesTried: string[];
  excludedApprox: number;
  carouselKey: string;
}) {
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-dashed border-emerald-500/25 bg-emerald-50/15 p-3 dark:bg-emerald-950/15">
      <SpotVerificationStrip spot={spot} />
      <SpotImageAdminDiagnostics
        key={carouselKey}
        imageQuery={imageQuery}
        naverCount={naverFetchedCount}
        slideCount={slidesLength}
        usedFallbackOnly={usedFallbackOnly}
        usedBroadFallback={usedBroadFallback}
        spot={spot}
        primaryPlace={primaryPlace}
        placeSimilarityScore={placeSimilarityScore}
        searchQueryUsedForResolve={searchQueryUsedForResolve}
        imageQueriesTried={imageQueriesTried}
        excludedApprox={excludedApprox}
      />
    </div>
  );
}

// ─── RoutePostDetailClient ────────────────────────────────────────────────────

export function RoutePostDetailClient({
  post,
  requestHost,
  isSuperAdmin = false,
  /** 스팟 펼침·실명·풀 갤러리 — 현재는 서버에서 슈퍼관리자만 true. TODO: 결제 완료 여부 연동 */
  hasPlaybookPremium = false,
}: {
  post: ContentPost;
  requestHost: GuardianRequestSheetHostProps;
  /** Dev/demo: 슈퍼관리자 세션이면 true — 페이월을 건너뜁니다. */
  isSuperAdmin?: boolean;
  hasPlaybookPremium?: boolean;
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
  /** 슈퍼관리자 전용 이미지·검수 디버그 — 기본 숨김 */
  const [adminDebugOpen, setAdminDebugOpen] = useState(false);
  /** 데모 잠금 해제 — 메모리만(새로고침 시 초기화). TODO: 실제 구독/결제 연동 */
  const [playbookSessionUnlock, setPlaybookSessionUnlock] = useState(false);
  const [payDrawerOpen, setPayDrawerOpen] = useState(false);

  const effectivePlaybookPremium = hasPlaybookPremium || playbookSessionUnlock;

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
          venueSafe={!effectivePlaybookPremium}
        />
      ) : null}

      <PlaybookUnlockSheet
        open={payDrawerOpen}
        onOpenChange={setPayDrawerOpen}
        onConfirmDemoUnlock={() => setPlaybookSessionUnlock(true)}
        guardianOpenDetail={{
          guardianUserId: requestHost.guardianUserId,
          displayName: requestHost.displayName,
          headline: requestHost.headline,
          avatarUrl: requestHost.avatarUrl,
          suggestedRegionSlug: requestHost.suggestedRegionSlug ?? null,
          postId: post.id,
          postTitle: post.title,
        }}
      />

      <div className="space-y-8 sm:space-y-10">
        {/* ① 하루 프리뷰 + 소개·하이라이트 통합 — 스티키 내비 트리거 */}
        <div ref={triggerRef}>
          <RouteDayPreview
            post={post}
            introLead={introPrimary.trim() || undefined}
            topHighlights={post.route_highlights && post.route_highlights.length > 0 ? post.route_highlights : undefined}
            venueSafe={!effectivePlaybookPremium}
          />
        </div>

        {/* ② 본문 아티클 */}
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

        {/* ③ 하루 플레이북 타임라인 */}
        <section className="max-w-[42rem] border-t border-border/40 pt-7 sm:pt-8">
          <header className="mb-7 space-y-1">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {t("routeEyebrow")}
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">
              {t("flowTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("flowSubtitlePlaybook")}</p>
            {!isSuperAdmin && !effectivePlaybookPremium ? (
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{t("paywallConsolidatedHint")}</p>
            ) : null}
          </header>

          {isSuperAdmin ? (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setAdminDebugOpen((v) => !v)}
                className="text-muted-foreground hover:text-foreground text-xs font-medium underline underline-offset-4"
              >
                {adminDebugOpen ? t("debugPanelClose") : t("debugPanelOpen")}
              </button>
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
                hasPlaybookPremium={effectivePlaybookPremium}
                showAdminDebug={isSuperAdmin && adminDebugOpen}
                isFlashing={flashId === spot.id}
                onOpenPayDrawer={() => setPayDrawerOpen(true)}
              />
            ))}
          </div>
        </section>

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
