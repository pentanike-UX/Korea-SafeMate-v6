import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { mockContentCategories, mockContentPosts, mockRegions } from "@/data/mock";
import {
  getContentPostFormat,
  getPostHeroImageUrl,
  postHasRouteJourney,
} from "@/lib/content-post-route";
import { isActiveLaunchArea, type PublicGuardian } from "@/lib/guardian-public";
import { listPostsForGuardian } from "@/lib/posts-public";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrustBadgesServer } from "@/components/forty-two/trust-badges-server";
import { GuardianInsightPostSheetRow } from "@/components/guardians/guardian-insight-post-sheet-row";
import { GuardianPostsExplorerSheet } from "@/components/guardians/guardian-posts-explorer-sheet";
import { GuardianRequestDefaultsPublisher } from "@/components/guardians/guardian-request-defaults-publisher";
import { GuardianRequestOpenTrigger } from "@/components/guardians/guardian-request-sheet";
import { GuardianStickyCta } from "@/components/guardians/guardian-sticky-cta";
import { GuardianTravelerReviewsList } from "@/components/guardians/guardian-traveler-reviews-list";
import { clampSheetHeadline } from "@/lib/guardian-sheet-headline";
import { filterIntroGalleryExcludingHero } from "@/lib/guardian-intro-gallery";
import { resolveRepresentativeContentPosts } from "@/lib/guardian-representative-post-context";
import {
  guardianProfileImageUrls,
  GUARDIAN_AVATAR_COVER_CLASS,
  GUARDIAN_PROFILE_HERO_COVER_CLASS,
} from "@/lib/guardian-profile-images";
import { GuardianIntroGallery } from "@/components/guardians/guardian-intro-gallery";
import { GUARDIAN_TIER_ROLE_BADGE_CLASSNAME, guardianTierBadgeVariant } from "@/lib/guardian-tier-ui";
import type { GuardianTrustBadgeId, LocalizedCopy } from "@/types/guardian-marketing";
import type { TravelerReview } from "@/types/domain";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Globe2, MessageCircleHeart, Sparkles, Star, Zap } from "lucide-react";

function marketingLine(locale: string, copy: LocalizedCopy): string {
  return locale === "ko" ? copy.ko : copy.en;
}

const TRUST_ICONS: Record<GuardianTrustBadgeId, typeof CheckCircle2> = {
  verified: CheckCircle2,
  language_checked: Globe2,
  reviewed: MessageCircleHeart,
  fast_response: Zap,
};

export async function GuardianDetailView({
  guardian: g,
  mergedReviews,
}: {
  guardian: PublicGuardian;
  mergedReviews: TravelerReview[];
}) {
  const t = await getTranslations("GuardianDetail");
  const tReq = await getTranslations("GuardianRequest");
  const tLaunch = await getTranslations("LaunchAreas");
  const tTier = await getTranslations("GuardianTier");
  const locale = await getLocale();
  const isKo = locale === "ko";
  const line = (copy: LocalizedCopy) => marketingLine(locale, copy);

  const areaLive = isActiveLaunchArea(g.launch_area_slug);
  const insightPosts = resolveRepresentativeContentPosts(g, mockContentPosts, 3);

  const authorApprovedPosts = listPostsForGuardian(g.user_id).filter((p) => p.status === "approved");
  const postSheetItems = authorApprovedPosts.map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.summary,
    imageUrl: getPostHeroImageUrl(p),
    kind: p.kind,
    hero_subject: p.hero_subject,
  }));

  const reviews = mergedReviews;
  const displayCount = reviews.length > 0 ? reviews.length : g.review_count_display;
  const displayAvg =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : g.avg_traveler_rating;
  const showHeroReviews = displayAvg != null && displayCount > 0;
  const travelerAvgLine =
    displayAvg != null ? (isKo ? `여행자 평균 ${displayAvg.toFixed(1)}점` : `Avg. traveler rating ${displayAvg.toFixed(1)}`) : null;
  const listAvg = displayAvg ?? 0;
  const areaName = (tLaunch.raw(g.launch_area_slug) as { name: string }).name;

  const imgs = guardianProfileImageUrls(g);
  const introGalleryUrls = filterIntroGalleryExcludingHero(imgs.landscape, g.intro_gallery_image_urls);
  const sheetRegion = mockRegions.some((r) => r.slug === g.primary_region_slug) ? g.primary_region_slug : null;

  const longBioParagraphs = line(g.long_bio)
    .split(/\n\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const heroHeadline =
    g.headline?.trim() || longBioParagraphs[0]?.trim() || line(g.positioning).trim() || "";
  const sheetHeadlineForPublisher = clampSheetHeadline(heroHeadline || line(g.positioning));

  const categoryLabel = (slug: string) => mockContentCategories.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="bg-[var(--bg-page)] pb-28 md:pb-12">
      <GuardianRequestDefaultsPublisher
        guardianUserId={g.user_id}
        displayName={g.display_name}
        headline={sheetHeadlineForPublisher}
        avatarUrl={imgs.avatar}
        suggestedRegionSlug={sheetRegion}
      />
      {!areaLive ? (
        <div className="border-b border-amber-500/25 bg-amber-500/10">
          <p className="text-foreground mx-auto max-w-6xl px-4 py-3 text-center text-sm sm:px-6">{t("areaSoon")}</p>
        </div>
      ) : null}

      <div className="relative">
        <div className="relative mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <Link
            href="/guardians"
            className="group/back text-muted-foreground hover:text-foreground mb-4 -ml-2 inline-flex items-center gap-1.5 border-b-2 border-transparent pb-0.5 text-sm font-medium transition-all duration-200 hover:border-border/70 hover:gap-2"
          >
            <ArrowLeft className="size-4 shrink-0 transition-transform duration-200 group-hover/back:-translate-x-0.5" aria-hidden />
            {t("backToList")}
          </Link>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="border-border/60 relative aspect-[21/9] min-h-0 overflow-hidden rounded-[1.75rem] border bg-muted shadow-[var(--shadow-md)] sm:aspect-[3/1]">
            <Image src={imgs.landscape} alt="" fill className={GUARDIAN_PROFILE_HERO_COVER_CLASS} priority sizes="100vw" />
            <div className="pointer-events-none absolute inset-0 bg-black/30" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050a14]/95 via-[#0e1b3d]/55 to-[#0e1b3d]/15" />
            <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-3 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-10">
              <div className="min-w-0 max-w-3xl">
                <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                  <div className="border-background/40 relative size-14 min-h-0 min-w-0 shrink-0 overflow-hidden rounded-full border-2 shadow-md ring-2 ring-black/20 sm:size-[4.25rem]">
                    <Image src={imgs.avatar} alt="" fill className={GUARDIAN_AVATAR_COVER_CLASS} sizes="72px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)] sm:text-4xl">
                      {g.display_name}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={guardianTierBadgeVariant(g.guardian_tier)}
                        className={cn(
                          GUARDIAN_TIER_ROLE_BADGE_CLASSNAME,
                          "border-white/30 bg-black/35 text-white shadow-md backdrop-blur-md",
                        )}
                      >
                        {tTier(g.guardian_tier)}
                      </Badge>
                    </div>
                  </div>
                </div>
                {heroHeadline ? (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)] sm:mt-3 sm:text-base">
                    {heroHeadline}
                  </p>
                ) : null}
                {showHeroReviews ? (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mt-3">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/30 px-2.5 py-1 text-sm text-white shadow-inner backdrop-blur-sm">
                      <Star className="size-4 shrink-0 fill-amber-300 text-amber-200 drop-shadow-sm" aria-hidden />
                      <span className="font-semibold tabular-nums drop-shadow-sm">{displayAvg!.toFixed(1)}</span>
                      <span className="text-white/75 text-xs font-medium drop-shadow-sm">({displayCount})</span>
                    </span>
                    <a
                      href="#guardian-traveler-reviews"
                      className="text-xs font-medium text-white/80 underline-offset-4 transition-colors drop-shadow-sm hover:text-white hover:underline"
                    >
                      {t("heroReviewsLink")}
                    </a>
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-black/25 px-3 py-2 text-xs font-medium text-white/90 shadow-inner backdrop-blur-sm sm:mt-3 sm:text-[13px]">
                  <span className="drop-shadow-sm">{areaName}</span>
                  <span aria-hidden className="text-white/50">
                    ·
                  </span>
                  <span className="drop-shadow-sm">{g.languages.map((l) => l.language_code.toUpperCase()).join(" · ")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-10 lg:col-span-7">
          <section>
            <h2 className="text-text-strong text-lg font-semibold">{t("introTitle")}</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{t("introDecisionLead")}</p>
            <div className="text-muted-foreground mt-3 space-y-4 text-sm leading-relaxed sm:text-[15px]">
              {longBioParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <p className="text-muted-foreground/90 border-border/50 mt-4 rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-sm italic leading-relaxed">
              {line(g.signature_style)}
            </p>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{line(g.response_note)}</p>
          </section>

          <GuardianIntroGallery
            displayName={g.display_name}
            urls={introGalleryUrls}
            title={t("introGalleryTitle")}
            lead={t("introGalleryLead")}
          />

          {(() => {
            const src = g.strength_items?.length
              ? g.strength_items
              : g.expertise_tags.map((tag) => ({ tag, blurb: { ko: "", en: "" } }));

            const visible = src
              .map((item) => {
                const blurb = (item.blurb?.ko || item.blurb?.en) ? line(item.blurb).trim() : "";
                const isTemplate =
                  blurb.includes("이(가)") && (blurb.includes("다음 선택지") || blurb.includes("급하게 결정하지"));
                const isEmpty = !blurb;
                return { item, blurb, hide: isEmpty || isTemplate };
              })
              .filter((x) => !x.hide);

            if (visible.length === 0) return null;

            return (
              <section>
                <h2 className="text-text-strong text-lg font-semibold">{t("expertiseTitle")}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{t("expertiseLead")}</p>
                <ul className="mt-4 space-y-4">
                  {visible.map(({ item, blurb }, i) => (
                    <li
                      key={`${item.tag}-${i}`}
                      className="border-border/60 bg-card/80 rounded-2xl border px-4 py-3 shadow-[var(--shadow-sm)]"
                    >
                      <span className="bg-primary/10 text-primary inline-block rounded-full px-3 py-0.5 text-xs font-semibold">
                        {item.tag}
                      </span>
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{blurb}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })()}

          <section>
            <p className="text-primary text-[10px] font-bold tracking-wide uppercase">{t("decisionRationaleEyebrow")}</p>
            <h2 className="text-text-strong mt-1 text-lg font-semibold">{t("trustTitle")}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{t("trustLead")}</p>
            {g.trust_reason_items?.length ? (
              <ul className="mt-4 space-y-3">
                {g.trust_reason_items.map((item, idx) => {
                  const Icon = item.badge_id ? TRUST_ICONS[item.badge_id] ?? Sparkles : Sparkles;
                  const headline =
                    item.badge_id === "reviewed" && travelerAvgLine ? travelerAvgLine : line(item.headline);
                  return (
                    <li
                      key={idx}
                      className="border-border/60 bg-card flex gap-3 rounded-2xl border p-4 shadow-[var(--shadow-sm)]"
                    >
                      <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-foreground text-sm font-semibold leading-snug">{headline}</p>
                        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{line(item.detail)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-4">
                <TrustBadgesServer ids={g.trust_badge_ids} />
              </div>
            )}
          </section>

          <section id="guardian-posts">
            <p className="text-primary text-[10px] font-bold tracking-wide uppercase">{t("postsDecisionEyebrow")}</p>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-text-strong text-lg font-semibold">{t("postsTitle")}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{t("postsLead")}</p>
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{t("postsDecisionLead")}</p>
              </div>
              {postSheetItems.length > 0 ? (
                <GuardianPostsExplorerSheet
                  guardianDisplayName={g.display_name}
                  posts={postSheetItems}
                  triggerVariant="asideOutline"
                  className="sm:min-w-[11rem]"
                />
              ) : null}
            </div>
            {insightPosts.length === 0 ? (
              <p className="text-muted-foreground mt-3 text-sm">{t("noPosts")}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {insightPosts.map((p) => {
                  const fmt = getContentPostFormat(p);
                  const route = postHasRouteJourney(p);
                  const thumb = getPostHeroImageUrl(p);
                  const fmtLabel =
                    fmt === "hybrid"
                      ? t("postFormatHybrid")
                      : fmt === "route"
                        ? t("postFormatRoute")
                        : fmt === "spot"
                          ? t("postFormatSpot")
                          : t("postFormatArticle");
                  let regionLabel: string;
                  try {
                    regionLabel = (tLaunch.raw(p.region_slug) as { name: string }).name;
                  } catch {
                    regionLabel = p.region_slug;
                  }
                  const themeLabel = categoryLabel(p.category_slug);
                  return (
                    <GuardianInsightPostSheetRow
                      key={p.id}
                      post={p}
                      imageUrl={thumb}
                      fmtLabel={fmtLabel}
                      regionLabel={regionLabel}
                      themeLabel={themeLabel}
                      route={route}
                      stopsLabel={route ? t("stopsLabel", { count: p.route_journey!.spots.length }) : null}
                    />
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-text-strong text-lg font-semibold">{t("routesTitle")}</h2>
            <ul className="mt-4 space-y-3">
              {g.recommended_routes.map((r, i) => (
                <li key={i}>
                  <Card className="border-border/60 rounded-2xl border bg-card/90 shadow-none">
                    <CardContent className="p-4 sm:p-5">
                      <p className="font-semibold">{line(r.title)}</p>
                      <p className="text-muted-foreground mt-2 text-sm">{line(r.blurb)}</p>
                      <Button asChild size="sm" variant="outline" className="mt-3 rounded-xl">
                        <Link href="/routes/mock?preview=1">{t("viewSampleRoute")}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-border/50 border-t pt-2">
            <p className="text-primary text-[10px] font-bold tracking-wide uppercase">{t("reviewsDecisionEyebrow")}</p>
            <GuardianTravelerReviewsList
              reviews={reviews}
              locale={locale}
              avg={listAvg}
              sectionTitle={t("reviewsTitle")}
              lead={t("reviewsLead")}
              avgAria={t("reviewsAvgAria", { avg: listAvg.toFixed(1) })}
              showMore={t("reviewsShowMore")}
              showLess={t("reviewsShowLess")}
              sheetTitle={t("reviewsBrowseSheetTitle")}
            />
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div id="request" className="border-border/60 bg-card lg:sticky lg:top-24 space-y-4 rounded-2xl border p-6 shadow-[var(--shadow-sm)]">
            <p className="text-primary text-[10px] font-bold tracking-[0.18em] uppercase">{t("requestCardEyebrow")}</p>
            <h2 className="text-text-strong text-lg font-semibold">{t("requestCardTitle")}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{t("requestLead")}</p>
            <ul className="text-muted-foreground space-y-2 text-xs leading-relaxed">
              <li className="flex gap-2">
                <span className="text-primary font-bold" aria-hidden>
                  ·
                </span>
                <span>{tReq("asideBulletHalfFull")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold" aria-hidden>
                  ·
                </span>
                <span>{tReq("asideBulletRegion")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold" aria-hidden>
                  ·
                </span>
                <span>{tReq("asideBulletTheme")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold" aria-hidden>
                  ·
                </span>
                <span>{tReq("asideBulletFlexible")}</span>
              </li>
            </ul>
            <p className="text-muted-foreground text-xs leading-relaxed">{t("requestGuide")}</p>
            <GuardianRequestOpenTrigger size="lg" className="h-12 w-full rounded-2xl text-base font-semibold shadow-[var(--shadow-brand)]">
              {tReq("openCta")}
            </GuardianRequestOpenTrigger>
          </div>
        </aside>
      </div>

      <GuardianStickyCta />
    </div>
  );
}
