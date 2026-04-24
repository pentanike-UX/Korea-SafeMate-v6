import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ContentPost } from "@/types/domain";
import { relatedPostsForMerged } from "@/lib/posts-public-merged.server";
import {
  getPostHeroImageAlt,
  getPostHeroImageUrl,
  getPostSecondaryImageAlt,
  getPostSecondaryImageUrl,
  postHasOwnVisualMedia,
  postHasRouteJourney,
} from "@/lib/content-post-route";
import { GuardianRequestDefaultsPublisher } from "@/components/guardians/guardian-request-defaults-publisher";
import { PostAuthorAside } from "@/components/posts/post-author-aside";
import { PostDetailStickyAside } from "@/components/posts/post-detail-sticky-aside";
import { RoutePostDetailView } from "@/components/posts/route-post-detail-view";
import { getPublicGuardianByIdMerged } from "@/lib/guardian-public-merged.server";
import { guardianProfileImageUrls } from "@/lib/guardian-profile-images";
import { mockRegions } from "@/data/mock";
import { clampSheetHeadline, resolveGuardianHeadlineWithPostFallback } from "@/lib/guardian-sheet-headline";
import {
  POST_DETAIL_PARAGRAPH_STACK,
  POST_DETAIL_PROSE_P_MAIN,
  splitPostBodyLeadRest,
  splitPostBodyParagraphs,
} from "@/lib/post-detail-body-split";
import { resolvePracticalArticleRender } from "@/lib/post-structured-content";
import { PracticalTipStructuredBody } from "@/components/posts/practical-tip-structured-body";
import { resolvePostTypeLabelKey } from "@/lib/post-detail-type-label";
import { PostDetailHero } from "@/components/posts/post-detail-hero";
import { PostDetailIntroPanel } from "@/components/posts/post-detail-intro-panel";
import { PostDetailRelatedSection } from "@/components/posts/post-detail-related-section";
import { postHeroCoverClass } from "@/lib/post-image-crop";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export async function PostDetailView({ post }: { post: ContentPost }) {
  if (postHasRouteJourney(post)) {
    return <RoutePostDetailView post={post} />;
  }

  const t = await getTranslations("Posts");
  const related = await relatedPostsForMerged(post);
  const heroCover = getPostHeroImageUrl(post);
  const heroAlt = getPostHeroImageAlt(post);
  const guardian = await getPublicGuardianByIdMerged(post.author_user_id);
  const sheetAvatar = guardian ? guardianProfileImageUrls(guardian).avatar : heroCover;
  const sheetHeadlineRaw = resolveGuardianHeadlineWithPostFallback(guardian?.headline, post.summary);
  const sheetHeadline = clampSheetHeadline(sheetHeadlineRaw);
  const sheetName = guardian?.display_name ?? post.author_display_name;
  const sheetRegion =
    guardian && mockRegions.some((r) => r.slug === guardian.primary_region_slug)
      ? guardian.primary_region_slug
      : mockRegions.some((r) => r.slug === post.region_slug)
        ? post.region_slug
        : null;
  const secondaryCover = getPostSecondaryImageUrl(post);
  const secondaryAlt = getPostSecondaryImageAlt(post);
  const showEnrichedPair = !postHasOwnVisualMedia(post) && secondaryCover;

  const { lead, rest } = splitPostBodyLeadRest(post.body);
  const articleIntro = lead.length > 0 && rest.length > 0;
  const bodyText = articleIntro ? rest : post.body.trim();
  const practicalRender = resolvePracticalArticleRender(post.structured_content, bodyText);
  const typeLabelKey = resolvePostTypeLabelKey(post);
  /** 인트로 카드가 있으면 요약 첫 줄 대신 태그로 한 줄 팁 — 도입부 중복 완화 */
  const oneLineFromSummary =
    post.summary
      .trim()
      .split(/\n+/)[0]
      ?.trim()
      .slice(0, 140) ?? "";
  const oneLineTip = articleIntro
    ? post.tags[0]
      ? `${t("articleOneLineFromTagPrefix")} ${post.tags[0]}`
      : ""
    : oneLineFromSummary;
  const showOneLineTip = oneLineTip.length > 0;

  return (
    <article className="bg-[var(--bg-page)] pb-16">
      <GuardianRequestDefaultsPublisher
        guardianUserId={post.author_user_id}
        displayName={sheetName}
        headline={sheetHeadline}
        avatarUrl={sheetAvatar}
        suggestedRegionSlug={sheetRegion}
      />
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <Link
          href="/posts"
          className="group/back text-muted-foreground hover:text-foreground mb-4 -ml-2 inline-flex items-center gap-1.5 border-b-2 border-transparent pb-0.5 text-sm font-medium transition-all duration-200 hover:border-border/70 hover:gap-2"
        >
          <ArrowLeft className="size-4 shrink-0 transition-transform duration-200 group-hover/back:-translate-x-0.5" aria-hidden />
          {t("backToList")}
        </Link>
      </div>

      <PostDetailHero post={post} coverUrl={heroCover} coverAlt={heroAlt} typeLabelKey={typeLabelKey} postId={post.id} />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-12 lg:gap-12">
        <div className="max-w-none space-y-8 lg:col-span-8">
          {articleIntro ? <PostDetailIntroPanel variant="article" primary={lead} /> : null}

          {showOneLineTip ? (
            <div className="border-primary/35 text-foreground rounded-xl border-l-[3px] bg-primary/5 px-4 py-3 text-[15px] leading-relaxed sm:text-base">
              <span className="text-primary mb-2 block text-[10px] font-bold tracking-[0.18em] uppercase">
                {t("articleOneLineTipEyebrow")}
              </span>
              <p className="whitespace-pre-line leading-relaxed">
                {oneLineTip}
                {!articleIntro && post.summary.trim().length > 140 ? "…" : ""}
              </p>
            </div>
          ) : null}

          {post.summary.trim() ? (
            <Card className="border-border/60 rounded-2xl border bg-white/90 shadow-[var(--shadow-sm)]">
              <CardContent className="space-y-4 p-5 sm:p-6">
                <p className="text-primary text-[10px] font-bold tracking-[0.2em] uppercase">{t("articleKeyTakeawayEyebrow")}</p>
                <div className={POST_DETAIL_PARAGRAPH_STACK}>
                  {splitPostBodyParagraphs(post.summary.trim()).map((para, i) => (
                    <p key={i} className={POST_DETAIL_PROSE_P_MAIN}>
                      {para}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {showEnrichedPair ? (
            <figure className="border-border/60 relative aspect-[16/10] overflow-hidden rounded-xl border sm:aspect-[21/9]">
              <Image
                src={secondaryCover!}
                alt={secondaryAlt ?? heroAlt}
                fill
                className={postHeroCoverClass(post)}
                sizes="(max-width:1024px) 100vw, 66vw"
              />
            </figure>
          ) : null}

          {bodyText ? (
            practicalRender.mode === "blocks" ? (
              <PracticalTipStructuredBody parsed={practicalRender.data} />
            ) : (
              <div className={POST_DETAIL_PARAGRAPH_STACK}>
                {splitPostBodyParagraphs(practicalRender.text).map((para, i) => (
                  <p key={i} className={POST_DETAIL_PROSE_P_MAIN}>
                    {para}
                  </p>
                ))}
              </div>
            )
          ) : null}

          {post.tags.length > 0 ? (
            <Card className="border-border/60 rounded-2xl border bg-muted/15 shadow-[var(--shadow-sm)]">
              <CardContent className="space-y-3 p-5 sm:p-6">
                <p className="text-primary text-[10px] font-bold tracking-[0.2em] uppercase">{t("articleTopicGuideEyebrow")}</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded-full border-border/70 font-medium">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <PostDetailStickyAside id="post-author-aside">
          <PostAuthorAside post={post} />
        </PostDetailStickyAside>
      </div>

      <PostDetailRelatedSection current={post} related={related} />

      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <Card className="border-border/60 rounded-2xl border bg-card/95">
          <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex items-center gap-3">
              <div className="border-border/60 relative size-8 shrink-0 overflow-hidden rounded-full border bg-muted">
                <Image src={sheetAvatar} alt="" fill sizes="32px" className="object-cover" />
              </div>
              <p className="text-sm font-semibold">
                {t("ctaRequestCourseBody", { name: sheetName })}
              </p>
            </div>
            <Link
              href={`/guardians/${post.author_user_id}#request`}
              className="bg-primary text-primary-foreground inline-flex h-10 min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-[var(--shadow-brand)]"
            >
              {t("ctaRequestBtn")}
            </Link>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
