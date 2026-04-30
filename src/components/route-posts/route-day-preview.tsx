"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ContentPost } from "@/types/domain";
import { getContentPostFormat } from "@/lib/content-post-route";
import { PostSampleBadge } from "@/components/posts/post-sample-badge";
import { Badge } from "@/components/ui/badge";
import { listCardMetaBlockClass } from "@/components/ui/action-variants";
import { routeCardAreaLabel, routeCardSpotPreviewLine } from "@/lib/route-post-card-meta";
import { cn } from "@/lib/utils";

function moodTagKey(tag: string): `moodTag.${string}` {
  return `moodTag.${tag}` as `moodTag.${string}`;
}

/**
 * 홈 `RoutePostCard`와 맞춘 톤의 하루 프리뷰 — Hero 직후 최상단용.
 */
export function RouteDayPreview({ post, className }: { post: ContentPost; className?: string }) {
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
      .slice(0, 200) ||
    "";

  const moodExtra = exposure?.reason_line?.trim();
  const moodTags = exposure?.mood_tags?.map((tag) => t(moodTagKey(tag))) ?? [];

  const areaLabel = routeCardAreaLabel(post);
  const spotPreviewLine = routeCardSpotPreviewLine(post, 2);
  const cautionHint = post.route_highlights?.[0]?.trim();

  return (
    <section
      className={cn(
        "border-border/70 bg-card max-w-[42rem] overflow-hidden rounded-2xl border shadow-[var(--shadow-sm)]",
        className,
      )}
      aria-label={t("dayPreviewAria")}
    >
      <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-primary text-[10px] font-bold tracking-widest uppercase">{t("dayPreviewEyebrow")}</p>
          {post.is_sample ? <PostSampleBadge /> : null}
          <Badge className="rounded-full bg-primary/10 text-[10px] font-bold text-primary">{formatLabel}</Badge>
          {showRouteIncludedBadge ? (
            <Badge variant="secondary" className="rounded-full border-0 bg-muted text-[10px] font-semibold">
              {t("cardBadgeRouteIncluded")}
            </Badge>
          ) : null}
        </div>

        <div className={cn(listCardMetaBlockClass, "text-foreground/90 mt-3")}>
          <p>
            <span className="font-medium text-foreground">{t("chipSpots", { count: journey.spots.length })}</span>
            <span aria-hidden> · </span>
            <span>{t("chipDistance", { km: meta.estimated_total_distance_km.toFixed(1) })}</span>
            <span aria-hidden> · </span>
            <span>{transportLabel}</span>
          </p>
          <p className="text-muted-foreground mt-1.5 text-xs leading-snug">
            <span className="font-medium text-foreground/90">{areaLabel}</span>
            {spotPreviewLine ? (
              <>
                <span aria-hidden className="mx-1 text-border">
                  ·
                </span>
                <span className="line-clamp-2">{spotPreviewLine}</span>
              </>
            ) : null}
          </p>
          <p className="mt-1 inline-flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-white/12 dark:text-white">
              <MapPin className="size-3 shrink-0 opacity-95" aria-hidden />
              {t("cardRoutePill")}
            </span>
          </p>
        </div>
      </div>

      <div className="border-border/60 space-y-0 border-t px-4 py-4 sm:px-5">
        <PreviewRow label={t("summaryDurationLabel")} value={t("chipDuration", { minutes: meta.estimated_total_duration_minutes })} />
        <PreviewRow label={t("summaryDistanceLabel")} value={t("chipDistance", { km: meta.estimated_total_distance_km.toFixed(1) })} />
        <PreviewRow label={t("summaryTimeOfDayLabel")} value={t(timeKey)} />
        <PreviewRow label={t("summaryPaceLabel")} value={t(`difficulty.${meta.difficulty}` as "difficulty.easy")} />
        {recommendedAudience ? (
          <PreviewRow label={t("dayPreviewAudienceLabel")} value={recommendedAudience} valueClassName="font-medium normal-case" />
        ) : null}
      </div>

      <div className="border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">{t("dayPreviewMoodLabel")}</p>
        {cautionHint ? (
          <p className="text-foreground mt-2 text-[13px] leading-snug">
            <span className="text-muted-foreground text-[10px] font-semibold uppercase">
              {t("caution")} ·{" "}
            </span>
            {cautionHint}
          </p>
        ) : null}
        {moodCore ? <p className="text-foreground mt-2 text-[15px] leading-[1.65]">{moodCore}</p> : null}
        {moodTags.length > 0 ? (
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{moodTags.join(" · ")}</p>
        ) : null}
        {moodExtra ? <p className="text-muted-foreground mt-2 text-xs leading-relaxed not-italic opacity-90">{moodExtra}</p> : null}
        <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
          <span className="font-semibold text-foreground">{meta.night_friendly ? t("nightYes") : t("nightNo")}</span>
          <span className="mx-1.5 text-border">·</span>
          {t("summaryNightHint")}
        </p>
      </div>
    </section>
  );
}

function PreviewRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="border-border/40 grid grid-cols-1 gap-1 border-b border-dashed py-3 last:border-b-0 sm:grid-cols-[minmax(0,7.5rem)_1fr] sm:items-baseline sm:gap-x-6">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <span className={cn("text-text-strong text-[15px] font-semibold tabular-nums", valueClassName)}>{value}</span>
    </div>
  );
}
