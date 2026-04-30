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

function firstCompactLine(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  const paras = splitPostBodyParagraphs(text);
  const line = paras[0]?.trim();
  if (!line) return null;
  return line.slice(0, 140);
}

function extractJudgementQuote(texts: Array<string | null | undefined>): string | null {
  const lines = texts
    .flatMap((t) => splitPostBodyParagraphs(t ?? ""))
    .map((x) => x.trim())
    .filter((x) => x.length >= 12);
  const strong = lines.find((x) => /궁 안|다시 나오기|길 수|대기 줄|변수/.test(x));
  if (strong) return strong;
  return lines[0] ?? null;
}

/** 상단 브리핑 — 긴 article 대신 compact 카드 모음 */
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

  const nightLine = `${meta.night_friendly ? t("nightYes") : t("nightNo")} · ${t("summaryNightHint")}`;
  const moodTailParts = [moodExtra && !textsOverlap(moodExtra, routeClosingRaw ?? "") ? moodExtra : null, moodTags.length ? moodTags.join(" · ") : null].filter(
    Boolean,
  ) as string[];
  const situationLine = firstCompactLine(recommendedAudience) || firstCompactLine(summaryParas[1]) || firstCompactLine(introLead);
  const tipLine = firstCompactLine(beforeParas.join("\n")) || firstCompactLine(highlightLines[0]);
  const finishLine = firstCompactLine(closingParas.join("\n")) || firstCompactLine(moodTailParts[0]);
  const movementLine = firstCompactLine(spotPreviewLine) || areaLabel;
  const judgementQuote = extractJudgementQuote([beforeYouGoRaw, routeClosingRaw, ...highlightLines]);

  return (
    <section className={cn("max-w-[42rem] space-y-3.5", className)} aria-label={t("dayPreviewAria")}>
      <header className="space-y-2">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">{t("playbookMemoEyebrow")}</p>
        <h2 className="text-[var(--text-strong)] text-lg font-semibold tracking-tight">{t("briefingTitle")}</h2>
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
          <p className="text-muted-foreground text-[12px] leading-relaxed sm:text-[13px]">{spotPreviewLine}</p>
        ) : null}
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <section className="rounded-xl border border-border/45 bg-card/80 px-3.5 py-3">
          <p className="text-[var(--text-strong)] text-[12px] font-semibold">{t("briefingSummaryTitle")}</p>
          <p className="text-muted-foreground mt-0.5 text-[11px]">{t("briefingSummarySubtitle")}</p>
          <ul className="mt-2.5 space-y-1 text-[13px] leading-relaxed text-foreground/90">
            <li>{t("chipDuration", { minutes: meta.estimated_total_duration_minutes })}</li>
            <li>{t("chipDistance", { km: meta.estimated_total_distance_km.toFixed(1) })}</li>
            <li>{t(timeKey)}</li>
            <li>{t(`difficulty.${meta.difficulty}` as "difficulty.easy")}</li>
          </ul>
        </section>

        <section className="rounded-xl border border-border/45 bg-muted/35 px-3.5 py-3">
          <p className="text-[var(--text-strong)] text-[12px] font-semibold">{t("briefingSituationTitle")}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">
            {situationLine || t("introFallbackMinimal")}
          </p>
          {recommendedAudience ? (
            <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
              <span className="font-medium text-foreground/85">{t("introForWhoLabel")}</span> {recommendedAudience}
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border border-amber-300/45 bg-amber-50/70 px-3.5 py-3 dark:bg-amber-900/10">
          <p className="text-[var(--text-strong)] text-[12px] font-semibold">{t("briefingTipTitle")}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">{tipLine || t("insightTitle")}</p>
          {highlightLines.length > 0 ? (
            <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">{highlightLines[0]}</p>
          ) : null}
        </section>

        <section className="rounded-xl border border-sky-300/45 bg-sky-50/70 px-3.5 py-3 dark:bg-sky-900/10">
          <p className="text-[var(--text-strong)] text-[12px] font-semibold">{t("briefingMovementTitle")}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">{movementLine}</p>
          <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">{transportLabel}</p>
        </section>

        <section className="rounded-xl border border-emerald-300/45 bg-emerald-50/70 px-3.5 py-3 dark:bg-emerald-900/10 sm:col-span-2">
          <p className="text-[var(--text-strong)] text-[12px] font-semibold">{t("briefingFinishTitle")}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">{finishLine || nightLine}</p>
          <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">{nightLine}</p>
          {moodTailParts.length > 0 ? (
            <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed italic">{moodTailParts.join(" · ")}</p>
          ) : null}
        </section>
      </div>

      {judgementQuote ? (
        <blockquote className="rounded-xl border border-border/45 bg-card/60 px-3.5 py-3">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">{t("briefingQuoteLabel")}</p>
          <p className="text-[var(--text-strong)] mt-1.5 border-l-2 border-primary/45 pl-3 text-[13px] leading-relaxed italic">
            “{judgementQuote}”
          </p>
        </blockquote>
      ) : null}
    </section>
  );
}
