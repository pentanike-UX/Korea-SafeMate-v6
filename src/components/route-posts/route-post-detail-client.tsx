"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { ContentPost, NaverPrimaryPlace, RouteJourneyMetadata, RouteSpot } from "@/types/domain";
import { RouteDayPreview } from "@/components/route-posts/route-day-preview";
import { RouteStickyLocalNav } from "@/components/route-posts/route-sticky-local-nav";
import { type GuardianRequestSheetHostProps } from "@/components/guardians/guardian-request-sheet";
import { GuardianSignatureQuote, PostInfoNarrativeStack } from "@/components/posts/post-info-blocks";
import { PlaybookUnlockSheet } from "@/components/route-posts/playbook-unlock-sheet";
import { useSpotGallery } from "@/hooks/use-spot-gallery";
import { buildLocalPostVisualPlan, type LocalPostVisualPlan } from "@/lib/post-local-images";
import { SpotImageCarousel } from "@/components/route-posts/spot-image-carousel";
import { SpotImageAdminDiagnostics } from "@/components/route-posts/spot-image-admin-diagnostics";
import { SpotVerificationStrip } from "@/components/route-posts/spot-verification-strip";
import {
  GooglePlacesSpotDebugBlock,
  GooglePlacesSpotInspectRow,
} from "@/components/route-posts/google-places-spot-inspect";
import { cn } from "@/lib/utils";
import type { FreeArchetype } from "@/lib/route-free-classification";
import { inferFreeArchetype } from "@/lib/route-free-classification";
import { ChevronDown } from "lucide-react";
import {
  POST_DETAIL_PARAGRAPH_STACK,
  POST_DETAIL_PROSE_P_MAIN,
  splitPostBodyLeadRest,
  splitPostBodyParagraphs,
} from "@/lib/post-detail-body-split";
import { resolveRouteArticleRender } from "@/lib/post-structured-content";
import {
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
    <div className="mt-1.5 flex items-stretch gap-0 sm:mt-2" role="separator" aria-label="다음 스팟으로 이동">
      <div className="text-primary/40 flex w-9 shrink-0 flex-col items-center sm:w-11">
        <div className="min-h-2 w-px flex-1 bg-border/40" />
      </div>
      <div className="text-muted-foreground flex min-w-0 flex-1 items-center py-0.5 pl-0.5 text-[10px] font-medium leading-tight sm:text-[11px]">
        <span aria-hidden className="mr-1 shrink-0 opacity-80">
          {emoji}
        </span>
        <span className="truncate">
          {mode}
          {parts.length > 0 ? <> · {parts.join(" ")}</> : null}
        </span>
      </div>
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
  expandedSpotId,
  onExpandedSpotChange,
  isSuperAdmin,
  adminDebugOpen,
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
  /** 유료: 어느 스팟이 펼쳐졌는지(한 번에 하나) */
  expandedSpotId: string | null;
  onExpandedSpotChange: (id: string | null) => void;
  /** 슈퍼관리자 — Google Places 검수 링크·디버그 */
  isSuperAdmin: boolean;
  adminDebugOpen: boolean;
  isFlashing: boolean;
  onOpenPayDrawer: () => void;
}) {
  const t = useTranslations("RoutePosts");
  const role = inferSpotRole(spot);
  const roleConf = ROLE_CONFIG[role];
  const collapsedTitle = freeTierMoodTitle(spot);
  const placeTitle = premiumSpotPlaceTitle(spot);
  const addressFallback = premiumSpotAddressLine(spot);

  const expanded = hasPlaybookPremium && expandedSpotId === spot.id;

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
    /** 접힘=텍스트 인덱스만 — 갤러리·Naver 호출은 펼친 뒤에만 */
    fetchRemote: expanded,
  });

  const gallerySlides = slides;

  const addressLine =
    primaryPlace?.roadAddress?.trim() ||
    primaryPlace?.address?.trim() ||
    addressFallback;

  const carouselKey = `${spot.id}-${pipelineDone ? "r" : "l"}-${primaryPlace?.title ?? "np"}-${naverFetchedCount}`;

  const closedExpandHint = t("playbookFoldHint");

  const adminBlock =
    isSuperAdmin && adminDebugOpen ? (
      hasPlaybookPremium ? (
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
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-emerald-500/25 bg-emerald-50/15 p-3 dark:bg-emerald-950/15">
          <GooglePlacesSpotDebugBlock spot={spot} />
        </div>
      )
    ) : null;

  const spine = (
    <div className="flex w-8 shrink-0 flex-col items-center sm:w-10">
      <time
        className="text-muted-foreground mb-1 text-[9px] font-semibold tabular-nums sm:text-[10px]"
        aria-label={`${time} 출발`}
      >
        {time}
      </time>
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-300 sm:size-8 sm:text-xs",
          isFlashing
            ? "bg-primary text-primary-foreground ring-2 ring-primary/25 ring-offset-1"
            : "bg-primary/10 text-primary",
        )}
        aria-label={`스팟 ${index + 1}`}
      >
        {index + 1}
      </div>
      {!isLast ? <div className="bg-border/35 mt-1.5 w-px flex-1 sm:mt-2" aria-hidden /> : null}
    </div>
  );

  /** 닫힘 공통: 분류형 타이틀 → 안내 → 칩 → 머무름 (이미지 없음) */
  const chipAndStay = (
    <>
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
          roleConf.badgeClass,
        )}
      >
        <span aria-hidden>{roleConf.emoji}</span>
        {roleConf.label}
      </span>
      {spot.stay_duration_minutes ? (
        <p className="text-muted-foreground text-[10px] font-medium">
          {t("stayDuration", { minutes: spot.stay_duration_minutes })}
        </p>
      ) : null}
    </>
  );

  /** 무료 — 항상 닫힘·텍스트 인덱스만. 탭 시 업그레이드 시트 */
  if (!hasPlaybookPremium) {
    return (
      <div id={`route-spot-${spot.id}`} className="flex gap-2 sm:gap-3">
        {spine}
        <div className={cn("min-w-0 flex-1", isLast ? "pb-0.5" : "pb-3")}>
          <button
            type="button"
            onClick={onOpenPayDrawer}
            className="border-border/40 bg-card/80 focus-visible:ring-ring w-full rounded-lg border px-2.5 py-2 text-left shadow-sm outline-none focus-visible:ring-2 sm:px-3 sm:py-2.5"
          >
            <p
              className={cn(
                "text-[var(--text-strong)] text-[13px] font-semibold leading-snug tracking-tight sm:text-[14px]",
                isFlashing && "text-primary",
              )}
            >
              {collapsedTitle}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug sm:text-[11px]">{closedExpandHint}</p>
            <div className="mt-1.5 flex flex-col gap-1">{chipAndStay}</div>
          </button>
          {isSuperAdmin ? (
            <div className="mt-2">
              <GooglePlacesSpotInspectRow spot={spot} />
            </div>
          ) : null}
          {adminBlock}
          {!isLast ? <MoveConnector spot={spot} /> : null}
        </div>
      </div>
    );
  }

  /** 유료 — 닫힘=인덱스만 / 펼침=갤러리·플레이북 */
  return (
    <div id={`route-spot-${spot.id}`} className="flex gap-2 sm:gap-3">
      {spine}
      <div className={cn("min-w-0 flex-1", isLast ? "pb-0.5" : "pb-4")}>
        <div className="border-border/50 overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-xs)]">
          {!expanded ? (
            <>
              <button
                type="button"
                onClick={() => onExpandedSpotChange(spot.id)}
                className="hover:bg-muted/35 focus-visible:ring-ring w-full px-2.5 py-2 text-left transition-colors outline-none focus-visible:ring-2 sm:px-3 sm:py-2.5"
                aria-expanded={false}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[var(--text-strong)] text-[13px] font-semibold leading-snug tracking-tight sm:text-[14px]",
                        isFlashing && "text-primary",
                      )}
                    >
                      {collapsedTitle}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug sm:text-[11px]">{closedExpandHint}</p>
                  </div>
                  <ChevronDown className="text-muted-foreground mt-0.5 size-4 shrink-0 sm:size-5" aria-hidden />
                </div>
                <div className="mt-1.5 flex flex-col gap-1">{chipAndStay}</div>
              </button>
              {isSuperAdmin ? (
                <div className="border-border/40 border-t px-3 py-2.5 sm:px-4">
                  <GooglePlacesSpotInspectRow spot={spot} />
                </div>
              ) : null}
            </>
          ) : (
            <div>
              <div className="border-border/45 flex items-center justify-between gap-2 border-b px-4 py-2.5 sm:px-5">
                <p className="text-muted-foreground min-w-0 flex-1 truncate text-[12px] font-medium">{collapsedTitle}</p>
                <button
                  type="button"
                  onClick={() => onExpandedSpotChange(null)}
                  className="text-muted-foreground hover:bg-muted/50 inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium"
                  aria-expanded
                  aria-controls={`route-spot-${spot.id}-expanded`}
                >
                  <ChevronDown className="size-4 rotate-180" aria-hidden />
                  {t("playbookCollapseShort")}
                </button>
              </div>
              <div className="space-y-4 px-4 pb-5 pt-4 sm:px-5" id={`route-spot-${spot.id}-expanded`}>
                {spot.leg_from_previous?.trim() ? <LegFromPrevious text={spot.leg_from_previous} /> : null}
                <div>
                  <p className="text-muted-foreground text-[11px] font-medium">{collapsedTitle}</p>
                  <h3 className="text-[var(--text-strong)] mt-1 text-xl font-bold tracking-tight">
                    {placeTitle || collapsedTitle}
                  </h3>
                  {addressLine ? (
                    <p className="text-muted-foreground mt-1 text-sm leading-snug">{addressLine}</p>
                  ) : null}
                  {isSuperAdmin ? <GooglePlacesSpotInspectRow spot={spot} className="mt-3" /> : null}
                </div>
                <SpotImageCarousel key={`full-${carouselKey}`} slides={gallerySlides} className="sm:max-w-none" />
                {spot.short_description ? (
                  <p className="text-foreground/85 text-[15px] leading-relaxed">{spot.short_description}</p>
                ) : null}
                <SpotFieldNotes spot={spot} />
              </div>
            </div>
          )}
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
      <GooglePlacesSpotDebugBlock spot={spot} />
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
  /** 유료: 동시에 하나의 스팟만 펼침 */
  const [expandedPlaybookSpotId, setExpandedPlaybookSpotId] = useState<string | null>(null);

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
  const routeArticleBlocks = routeArticleRender.mode === "blocks" ? routeArticleRender.data : null;

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
            articleParsed={routeArticleBlocks}
          />
        </div>

        {/* ② 스토리 본문 — 상단 플레이북 article과 분리(읽는 영역 연속) */}
        {routeArticleRender.mode === "blocks" && routeArticleRender.data.narrative?.trim() ? (
          <div className="max-w-[42rem] space-y-5">
            <PostInfoNarrativeStack text={routeArticleRender.data.narrative} />
          </div>
        ) : routeArticleRender.mode === "plain" && rest.trim() ? (
          <div className={POST_DETAIL_PARAGRAPH_STACK}>
            {splitPostBodyParagraphs(rest).map((para, i) => (
              <p key={i} className={POST_DETAIL_PROSE_P_MAIN}>
                {para}
              </p>
            ))}
          </div>
        ) : null}

        {/* ③ 하루 플레이북 타임라인 */}
        <section className="max-w-[42rem] border-t border-border/40 pt-7 sm:pt-8">
          <header className="mb-7 space-y-2">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {t("routeEyebrow")}
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">
              {t("flowTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("flowLeadShort")}</p>
            {!isSuperAdmin && !effectivePlaybookPremium ? (
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{t("paywallConsolidatedHint")}</p>
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
                expandedSpotId={expandedPlaybookSpotId}
                onExpandedSpotChange={setExpandedPlaybookSpotId}
                isSuperAdmin={isSuperAdmin}
                adminDebugOpen={adminDebugOpen}
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
