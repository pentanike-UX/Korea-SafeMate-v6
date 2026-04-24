"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { mockContentPosts } from "@/data/mock";
import { pickHomeRecommendedGuardians } from "@/lib/home-recommended-guardians";
import type { PublicGuardian } from "@/lib/guardian-public";
import { guardianProfileImageUrls, GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { GUARDIAN_TIER_ROLE_BADGE_CLASSNAME, guardianTierBadgeVariant } from "@/lib/guardian-tier-ui";
import { cn } from "@/lib/utils";
import { GuardianProfilePreviewSheetTrigger } from "@/components/guardians/guardian-profile-preview-sheet-trigger";
import { GuardianRequestOpenTrigger } from "@/components/guardians/guardian-request-sheet";
import {
  postContextFromGuardianRepresentative,
  representativePostLinesForSheetPreview,
} from "@/lib/guardian-representative-post-context";
import { SaveGuardianButton } from "@/components/guardians/save-guardian-button";
import { listCardActionButtonClass } from "@/components/ui/action-variants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextActionLink } from "@/components/ui/text-action";
import { publicGuardianToSheetPreview } from "@/lib/guardian-profile-sheet-preview";
import { TrustBadgeRow } from "@/components/forty-two/trust-badges";
import { useHomeExplorePreferences } from "@/components/home/home-explore-preferences";
import type { GuardianTier } from "@/types/domain";

const TRUST_BADGE_MAX = 4;
const TAG_MAX = 3;

export function HomeRecommendedGuardiansSection() {
  const { area, theme } = useHomeExplorePreferences();
  const t = useTranslations("Home");
  const tTier = useTranslations("GuardianTier");
  const tLaunch = useTranslations("LaunchAreas");
  const tThemes = useTranslations("ExperienceThemes");
  const locale = useLocale();
  const isKo = locale === "ko";

  const picks = useMemo(() => pickHomeRecommendedGuardians(area, theme, 3), [area, theme]);

  const moreHref = useMemo(() => {
    const p = new URLSearchParams();
    if (area) p.set("area", area);
    if (theme) p.set("theme", theme);
    const s = p.toString();
    return s ? `/guardians?${s}` : "/guardians";
  }, [area, theme]);

  function positioningLine(g: PublicGuardian) {
    return isKo ? g.positioning.ko : g.positioning.en;
  }

  function tierLabel(tier: GuardianTier) {
    return tTier(tier);
  }

  const decisionSummary =
    area || theme
      ? [area ? (tLaunch.raw(area) as { name: string }).name : null, theme ? (tThemes.raw(theme) as { title: string }).title : null]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <section className="border-border/35 border-t bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-14 md:py-16">
        <div className="mb-6 flex min-w-0 flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h2 className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
              {t("featuredGuardiansSectionTitle")}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-[15px]">
              {t("featuredGuardiansSectionLead")}
            </p>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed sm:text-sm">
              {decisionSummary ? (
                <>
                  <span className="text-foreground font-semibold">{decisionSummary}</span>
                  <span aria-hidden> · </span>
                  {t("decisionResultCount", { count: picks.length })}
                </>
              ) : (
                t("decisionSummaryDefault")
              )}
            </p>
          </div>
          <TextActionLink href={moreHref} className="shrink-0 self-start text-sm sm:text-[15px]">
            {t("recommendedGuardiansViewAll")}
          </TextActionLink>
        </div>

        <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {picks.map((g) => {
            const imgs = guardianProfileImageUrls(g);
            const repCtx = postContextFromGuardianRepresentative(g, mockContentPosts);
            return (
              <article
                key={g.user_id}
                className="border-border/70 bg-card flex flex-col rounded-[var(--radius-md)] border p-3 shadow-[var(--shadow-sm)] transition-shadow sm:p-4 hover:shadow-[var(--shadow-md)] active:scale-[0.99]"
              >
                <div className="flex gap-3">
                  <div className="border-border/50 relative size-14 shrink-0 overflow-hidden rounded-full border bg-muted sm:size-[4.25rem]">
                    {imgs.avatar ? (
                      <Image src={imgs.avatar} alt="" fill className={GUARDIAN_AVATAR_COVER_CLASS} sizes="72px" />
                    ) : (
                      <span className="text-muted-foreground flex size-full items-center justify-center text-lg font-semibold">
                        {g.display_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate font-semibold">{g.display_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant={guardianTierBadgeVariant(g.guardian_tier)}
                        className={cn(GUARDIAN_TIER_ROLE_BADGE_CLASSNAME)}
                      >
                        {tierLabel(g.guardian_tier)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-1 text-xs leading-snug">{g.headline}</p>
                  </div>
                </div>

                <div className="border-border/50 mt-3 rounded-xl border border-dashed bg-card/60 px-3 py-2">
                  <p className="text-primary text-[10px] font-bold tracking-wide uppercase">{t("decisionWhyLabel")}</p>
                  <p className="text-foreground mt-1 line-clamp-2 text-sm font-medium leading-snug">{positioningLine(g)}</p>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {g.expertise_tags.slice(0, TAG_MAX).map((tag) => (
                    <span
                      key={tag}
                      className="border-border/60 text-muted-foreground rounded-full border bg-transparent px-2 py-0.5 text-[10px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <TrustBadgeRow ids={g.trust_badge_ids.slice(0, TRUST_BADGE_MAX)} size="xs" className="mt-2.5" />

                <div className="mt-auto flex flex-1 flex-col gap-2 border-border/50 pt-4">
                  <GuardianRequestOpenTrigger
                    className={cn(listCardActionButtonClass, "w-full shadow-[var(--shadow-brand)]")}
                    openDetail={{
                      guardianUserId: g.user_id,
                      displayName: g.display_name,
                      headline: g.headline,
                      avatarUrl: imgs.avatar,
                      suggestedRegionSlug: g.primary_region_slug,
                      ...(repCtx ?? {}),
                    }}
                  >
                    {t("recommendedCtaRequest")}
                  </GuardianRequestOpenTrigger>
                  <div className="grid grid-cols-2 gap-2">
                    <GuardianProfilePreviewSheetTrigger
                      guardian={publicGuardianToSheetPreview(g, representativePostLinesForSheetPreview(g, mockContentPosts))}
                      triggerLabel={t("recommendedCtaDetail")}
                      triggerVariant="outline"
                      size="sm"
                      className={cn(listCardActionButtonClass, "w-full rounded-[var(--radius-md)]")}
                      postContext={repCtx}
                    />
                    <div className="[&_button]:min-h-9 [&_button]:h-9 [&_button]:w-full [&_button]:rounded-[var(--radius-md)] [&_button]:text-xs [&_button]:font-semibold sm:[&_button]:text-sm">
                      <SaveGuardianButton guardianUserId={g.user_id} compact />
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-9 min-h-9 justify-center rounded-[var(--radius-md)] text-xs font-medium"
                  >
                    <Link href={`/guardians/${g.user_id}`}>{t("recommendedCtaFullProfile")}</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <TextActionLink href={moreHref} className="text-base">
            {t("recommendedGuardiansMoreCta")}
          </TextActionLink>
        </div>
      </div>
    </section>
  );
}
