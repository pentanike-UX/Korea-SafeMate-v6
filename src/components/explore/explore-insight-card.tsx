"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ExploreInsight } from "@/lib/explore-utils";
import { GUARDIAN_TIER_ROLE_BADGE_CLASSNAME, guardianTierBadgeVariant } from "@/lib/guardian-tier-ui";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Bookmark, Share2, Star, ThumbsUp } from "lucide-react";

type Props = {
  insight: ExploreInsight;
  /** When false, hide duplicate region line (e.g. on region hub pages). */
  showRegion?: boolean;
};

export function ExploreInsightCard({ insight, showRegion = true }: Props) {
  const t = useTranslations("ExploreInsightCard");
  const tTier = useTranslations("GuardianTier");
  const { post, regionName, categoryName, authorTier, authorAvgRating, authorPosts30d, hasGuardianProfile } =
    insight;

  return (
    <Card className="border-primary/10 flex h-full flex-col overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="space-y-3 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-medium">
            {categoryName}
          </Badge>
          {post.featured ? (
            <Badge variant="featured" className="text-[10px]">
              {t("featuredPick")}
            </Badge>
          ) : null}
          {post.status !== "approved" ? (
            <Badge variant="destructive" className="text-[10px] capitalize">
              {post.status}
            </Badge>
          ) : null}
        </div>
        <div>
          <h3 className="text-foreground text-base leading-snug font-semibold tracking-tight">
            {post.title}
          </h3>
          {showRegion ? (
            <p className="text-muted-foreground mt-1 text-xs">{regionName}</p>
          ) : null}
        </div>
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">{post.summary}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pb-2">
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-foreground text-sm font-medium">{post.author_display_name}</span>
            <div className="flex flex-wrap items-center gap-2">
              {hasGuardianProfile && authorTier ? (
                <Badge variant={guardianTierBadgeVariant(authorTier)} className={cn(GUARDIAN_TIER_ROLE_BADGE_CLASSNAME)}>
                  {tTier(authorTier)}
                </Badge>
              ) : (
                <Badge variant="outline" className={cn(GUARDIAN_TIER_ROLE_BADGE_CLASSNAME)}>
                  {t("contributor")}
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-x-3 text-[11px]">
              {authorPosts30d != null ? (
                <span>{t("approved30d", { count: authorPosts30d })}</span>
              ) : null}
              {authorAvgRating != null ? (
                <span className="inline-flex items-center gap-0.5">
                  <Star className="text-primary size-3 fill-current" aria-hidden />
                  {t("travelerAvg", { rating: authorAvgRating.toFixed(1) })}
                </span>
              ) : null}
            </div>
            {insight.authorExpertiseTags.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-1">
                {insight.authorExpertiseTags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary/5 text-primary rounded px-1.5 py-0.5 text-[10px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="text-muted-foreground text-[10px]">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
          {post.helpful_rating != null ? (
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="size-3.5" aria-hidden />
              {t("helpful", { rating: post.helpful_rating.toFixed(1) })}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="size-3.5 opacity-60" aria-hidden />
            {t("usefulVotes", { count: post.usefulness_votes })}
          </span>
        </div>
      </CardContent>
      <CardFooter className="from-[var(--brand-primary-soft)]/25 to-[var(--brand-trust-blue-soft)]/20 mt-auto flex flex-col gap-3 border-t border-border/70 bg-gradient-to-r px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-lg"
            disabled
            title={t("bookmarkTodo")}
          >
            <Bookmark className="size-4" />
            <span className="sr-only">{t("bookmark")}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-lg"
            disabled
            title={t("shareTodo")}
          >
            <Share2 className="size-4" />
            <span className="sr-only">{t("share")}</span>
          </Button>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {hasGuardianProfile ? (
            <Button asChild size="sm" variant="outline" className="h-9 w-full rounded-lg sm:w-auto sm:min-w-[7.5rem]">
              <Link href={`/guardians#guardian-${post.author_user_id}`}>{t("guardian")}</Link>
            </Button>
          ) : null}
          <Button asChild size="sm" className="h-9 w-full rounded-lg font-semibold sm:w-auto sm:min-w-[7.5rem]">
            <Link href="/book">{t("bookSupport")}</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
