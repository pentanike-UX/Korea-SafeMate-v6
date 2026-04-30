"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ContentPost } from "@/types/domain";
import type { RouteArticleParsed } from "@/lib/post-detail-structured-parse";
import { getContentPostFormat } from "@/lib/content-post-route";
import { PostSampleBadge } from "@/components/posts/post-sample-badge";
import { Badge } from "@/components/ui/badge";
import { routeCardAreaLabel, routeCardSpotPreviewLine } from "@/lib/route-post-card-meta";
import { splitPostBodyParagraphs } from "@/lib/post-detail-body-split";
import { cn } from "@/lib/utils";

function moodTagKey(tag: string): `moodTag.${string}` {
  return `moodTag.${tag}` as `moodTag.${string}`;
}

function normCompact(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function textsOverlap(a: string, b: string): boolean {
  const na = normCompact(a);
  const nb = normCompact(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length > nb.length ? na : nb;
  if (shorter.length < 20) return na === nb;
  return longer.includes(shorter);
}

function dedupeHighlights(highlights: string[], referenceTexts: string[]): string[] {
  return highlights.filter((line) => {
    const t = line.trim();
    if (t.length < 4) return false;
    for (const ref of referenceTexts) {
      if (!ref?.trim()) continue;
      if (textsOverlap(t, ref)) return false;
    }
    return true;
  });
}

const proseArticle =
  "[&_p]:text-[15px] [&_p]:leading-[1.75] [&_p]:text-foreground/90 sm:[&_p]:text-base sm:[&_p]:leading-[1.8]";

/**
 * 하루웨이 상단 — 카드 나열 대신 하나의 로컬 플레이북 article.
 * 요약·입장 전 정리·마무리·야간/무드를 한 흐름으로 읽습니다.
 */
export function RouteDayPreview({
  post,
  className,
  introLead,
  topHighlights,
  venueSafe = false,
  articleParsed,
}: {
  post: ContentPost;
  className?: string;
  introLead?: string | null;
  topHighlights?: string[];
  venueSafe?: boolean;
  articleParsed?: RouteArticleParsed | null;
}) {
  const t = useTranslations("RoutePosts");
  const tPosts = useTranslations("Posts");
  const journey = post.route_journey;
  if (!journey) return null;

  const meta = journey.metadata;
  const exposure = journey.structured_exposure_meta;
  const routeStructured = post.structured_content?.template === "route_post" ? post.structured_content : null;

  const format = getContentPostFormat(post);
  const formatLabel =
    format === "hybrid"
      ? t("formatHybrid")
      : format === "route"
        ? t("formatRoute")
        : format === "spot"
          ? t("formatSpot")
          : tPosts("contentArticle");

  const showRouteIncludedBadge = format === "hybrid" || format === "route";
  const transportLabel = t(`transport.${meta.transport_mode}` as "transport.walk");
  const timeKey = `recommendedTime.${meta.recommended_time_of_day}` as const;

  const recommendedAudience =
    routeStructured?.data.route_best_for?.trim() ||
    exposure?.best_for_context?.trim() ||
    (meta.recommended_traveler_types.filter(Boolean).length > 0
      ? meta.recommended_traveler_types.join(" · ")
      : null);

  const moodCore =
    exposure?.summary_card?.trim() ||
    post.summary
      .trim()
      .split(/\n+/)[0]
      ?.trim()
      .slice(0, 280) ||
    "";

  const moodExtra = exposure?.reason_line?.trim();
  const moodTags = exposure?.mood_tags?.map((tag) => t(moodTagKey(tag))) ?? [];

  const areaLabel = routeCardAreaLabel(post);
  const spotPreviewLine = routeCardSpotPreviewLine(post, 2, { venueSafe });

  const routeSummary = articleParsed?.routeSummary?.trim();
  const beforeYouGoRaw = articleParsed?.beforeYouGo?.trim();
  const routeClosingRaw = articleParsed?.routeClosing?.trim();

  const summaryPrimary =
    routeSummary || moodCore || introLead?.trim() || post.summary.trim().split(/\n+/)[0]?.trim() || "";

  const summaryParas: string[] = [];
  if (summaryPrimary) summaryParas.push(summaryPrimary);
  if (introLead?.trim() && !textsOverlap(introLead, summaryPrimary)) {
    summaryParas.push(introLead.trim());
  }
  if (summaryParas.length === 0) {
    summaryParas.push(t("introFallbackMinimal"));
  }

  const referenceForDedupe = [summaryPrimary, beforeYouGoRaw ?? "", routeClosingRaw ?? "", moodExtra ?? ""].filter(
    Boolean,
  );

  const highlightLines = dedupeHighlights(topHighlights ?? [], referenceForDedupe);

  const beforeParas = beforeYouGoRaw ? splitPostBodyParagraphs(beforeYouGoRaw) : [];
  const closingParas = routeClosingRaw ? splitPostBodyParagraphs(routeClosingRaw) : [];

  const showPrepSection = beforeParas.length > 0 || highlightLines.length > 0;

  const nightLine = `${meta.night_friendly ? t("nightYes") : t("nightNo")} — ${t("summaryNightHint")}`;
  const moodTailParts = [moodExtra && !textsOverlap(moodExtra, routeClosingRaw ?? "") ? moodExtra : null, moodTags.length ? moodTags.join(" · ") : null].filter(
    Boolean,
  ) as string[];

  const showClosingSection =
    closingParas.length > 0 || moodTailParts.length > 0 || Boolean(nightLine);

  const statsLine = [
    t("chipSpots", { count: journey.spots.length }),
    t("chipDistance", { km: meta.estimated_total_distance_km.toFixed(1) }),
    t("chipDuration", { minutes: meta.estimated_total_duration_minutes }),
    transportLabel,
    t(timeKey),
    t(`difficulty.${meta.difficulty}` as "difficulty.easy"),
  ].join(" · ");

  return (
    <article
      className={cn(
        "border-border/35 max-w-[42rem] rounded-xl border border-dashed bg-muted/[0.04] px-4 py-7 sm:px-6 sm:py-9",
        proseArticle,
        className,
      )}
      aria-label={t("dayPreviewAria")}
    >
      <header className="space-y-3">
        <p className="text-muted-foreground text-[11px] font-medium tracking-[0.14em] uppercase">{t("playbookMemoEyebrow")}</p>
        <div className="flex flex-wrap items-center gap-2">
          {post.is_sample ? <PostSampleBadge /> : null}
          <Badge className="rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{formatLabel}</Badge>
          {showRouteIncludedBadge ? (
            <Badge variant="secondary" className="rounded-full border-0 bg-muted text-[10px] font-semibold">
              {t("cardBadgeRouteIncluded")}
            </Badge>
          ) : null}
          <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px] font-medium">
            <MapPin className="size-3 shrink-0 opacity-80" aria-hidden />
            {areaLabel}
          </span>
        </div>
        {spotPreviewLine ? (
          <p className="text-muted-foreground text-[13px] leading-relaxed sm:text-sm">{spotPreviewLine}</p>
        ) : null}
      </header>

      <section className="mt-8 space-y-4" aria-labelledby="route-day-summary-heading">
        <h2 id="route-day-summary-heading" className="text-foreground text-lg font-semibold tracking-tight">
          {t("sectionDaySummary")}
        </h2>
        <p className="text-muted-foreground text-[13px] leading-relaxed">{statsLine}</p>
        {recommendedAudience ? (
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            <span className="font-medium text-foreground/85">{t("introForWhoLabel")}</span> {recommendedAudience}
          </p>
        ) : null}
        <div className="space-y-4">
          {summaryParas.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      </section>

      {showPrepSection ? (
        <section className="mt-10 space-y-4" aria-labelledby="route-day-prep-heading">
          <h2 id="route-day-prep-heading" className="text-foreground text-lg font-semibold tracking-tight">
            {t("sectionPrep")}
          </h2>
          {beforeParas.length > 0 ? (
            <div className="space-y-4">
              {beforeParas.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          ) : null}
          {highlightLines.length > 0 ? (
            <ul className="list-none space-y-3 pl-0" aria-label={t("insightTitle")}>
              {highlightLines.map((line) => (
                <li key={line} className="flex gap-3 text-[15px] leading-relaxed sm:text-base">
                  <span className="text-primary mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/80" aria-hidden />
                  <span className="min-w-0 text-foreground/90">{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {showClosingSection ? (
        <section className="mt-10 space-y-4" aria-labelledby="route-day-close-heading">
          <h2 id="route-day-close-heading" className="text-foreground text-lg font-semibold tracking-tight">
            {t("sectionClosing")}
          </h2>
          {closingParas.length > 0 ? (
            <div className="space-y-4">
              {closingParas.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          ) : null}
          <p className="text-muted-foreground text-[14px] leading-relaxed">{nightLine}</p>
          {moodTailParts.length > 0 ? (
            <p className="text-muted-foreground text-[14px] leading-relaxed italic">{moodTailParts.join(" — ")}</p>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
