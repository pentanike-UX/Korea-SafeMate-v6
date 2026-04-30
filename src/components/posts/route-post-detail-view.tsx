import { cookies } from "next/headers";
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
import {
  MOCK_SUPER_ADMIN_COOKIE_NAME,
  isMockSuperAdminCookieValue,
  isSuperAdminLoginEnabled,
} from "@/lib/dev/mock-super-admin-auth";
import { ArrowLeft } from "lucide-react";

export async function RoutePostDetailView({ post }: { post: ContentPost }) {
  const t = await getTranslations("Posts");

  // 슈퍼관리자 쿠키가 있으면 페이월을 건너뜁니다 (ENABLE_SUPER_ADMIN_LOGIN=1 필요).
  const cookieStore = await cookies();
  const isSuperAdmin =
    isSuperAdminLoginEnabled() &&
    isMockSuperAdminCookieValue(cookieStore.get(MOCK_SUPER_ADMIN_COOKIE_NAME)?.value);

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

      <PostDetailHero post={post} coverUrl={heroCover} coverAlt={heroAlt} typeLabelKey={typeLabelKey} postId={post.id} isRoute />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-8">
          <RoutePostDetailClient
            post={post}
            isSuperAdmin={isSuperAdmin}
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
          <PostAuthorAside post={post} variant="route" />
        </PostDetailStickyAside>
      </div>

      <PostDetailRelatedSection current={post} related={related} />
    </article>
  );
}
