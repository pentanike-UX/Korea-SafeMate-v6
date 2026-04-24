import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ContentPost } from "@/types/domain";
import { getPostHeroImageAlt, getPostHeroImageUrl } from "@/lib/content-post-route";
import { getPublicGuardianByIdMerged } from "@/lib/guardian-public-merged.server";
import { guardianProfileImageUrls } from "@/lib/guardian-profile-images";
import { mockRegions } from "@/data/mock";
import { clampSheetHeadline, resolveGuardianHeadlineWithPostFallback } from "@/lib/guardian-sheet-headline";
import { relatedPostsForMerged } from "@/lib/posts-public-merged.server";
import { PostAuthorAside } from "@/components/posts/post-author-aside";
import { PostDetailHero } from "@/components/posts/post-detail-hero";
import { PostDetailRelatedSection } from "@/components/posts/post-detail-related-section";
import { PostDetailStickyAside } from "@/components/posts/post-detail-sticky-aside";
import { RoutePostDetailClient } from "@/components/route-posts/route-post-detail-client";
import { GuardianRequestDefaultsPublisher } from "@/components/guardians/guardian-request-defaults-publisher";
import { resolvePostTypeLabelKey } from "@/lib/post-detail-type-label";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export async function RoutePostDetailView({ post }: { post: ContentPost }) {
  const t = await getTranslations("Posts");
  const related = await relatedPostsForMerged(post);
  const guardian = await getPublicGuardianByIdMerged(post.author_user_id);
  const sheetAvatar = guardian ? guardianProfileImageUrls(guardian).avatar : getPostHeroImageUrl(post);
  const sheetHeadline = clampSheetHeadline(resolveGuardianHeadlineWithPostFallback(guardian?.headline, post.summary));
  const sheetName = guardian?.display_name ?? post.author_display_name;
  const sheetRegion =
    guardian && mockRegions.some((r) => r.slug === guardian.primary_region_slug)
      ? guardian.primary_region_slug
      : mockRegions.some((r) => r.slug === post.region_slug)
        ? post.region_slug
        : null;

  const heroCover = getPostHeroImageUrl(post);
  const heroAlt = getPostHeroImageAlt(post);
  const typeLabelKey = resolvePostTypeLabelKey(post);

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
        <div className="lg:col-span-8">
          <RoutePostDetailClient
            post={post}
            requestHost={{
              guardianUserId: post.author_user_id,
              displayName: sheetName,
              headline: sheetHeadline,
              avatarUrl: sheetAvatar,
              suggestedRegionSlug: sheetRegion,
            }}
          />
        </div>
        <PostDetailStickyAside id="post-author-aside" variant="route">
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
              <p className="text-sm font-semibold">{sheetName}에게 이 코스로 요청하기</p>
            </div>
            <Link
              href={`/guardians/${post.author_user_id}#request`}
              className="bg-primary text-primary-foreground inline-flex h-10 min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-[var(--shadow-brand)]"
            >
              요청하기
            </Link>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
