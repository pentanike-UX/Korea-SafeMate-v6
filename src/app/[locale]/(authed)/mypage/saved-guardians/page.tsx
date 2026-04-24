import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { PublicGuardian } from "@/lib/guardian-public";
import { listPublicGuardiansMerged } from "@/lib/guardian-public-merged.server";
import {
  getLatestApprovedPostsForGuardiansMergedBatch,
  listApprovedPostsByIdsMerged,
} from "@/lib/posts-public-merged.server";
import {
  collectRepresentativePostIds,
  postContextFromGuardianRepresentativeWithFallback,
  representativePostLinesForSheetPreviewWithFallback,
  resolveRepresentativeContentPost,
} from "@/lib/guardian-representative-post-context";
import { guardianProfileImageUrls, GUARDIAN_AVATAR_COVER_CLASS } from "@/lib/guardian-profile-images";
import { getSessionUserId } from "@/lib/supabase/server-user";
import { getTravelerSavedGuardianIdsUnified } from "@/lib/traveler-saved-unified.server";
import { GUARDIAN_TIER_ROLE_BADGE_CLASSNAME, guardianTierBadgeVariant } from "@/lib/guardian-tier-ui";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrustBadgesServer } from "@/components/forty-two/trust-badges-server";
import { BRAND } from "@/lib/constants";
import { MypageGuardianProfileSheetTrigger } from "@/components/mypage/mypage-guardian-profile-sheet-trigger";
import { SavedGuardianRequestButton } from "@/components/mypage/saved-guardian-request-button";
import { Star } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return { title: `${t("navSavedGuardians")} | ${BRAND.name}` };
}

export default async function TravelerSavedGuardiansPage() {
  const t = await getTranslations("TravelerHub");
  const tTier = await getTranslations("GuardianTier");
  const tReq = await getTranslations("GuardianRequest");
  const [all, userId] = await Promise.all([listPublicGuardiansMerged(), getSessionUserId()]);
  const savedIds = await getTravelerSavedGuardianIdsUnified(userId);
  const saved = savedIds.map((id) => all.find((g) => g.user_id === id)).filter(Boolean) as PublicGuardian[];

  const repIds = collectRepresentativePostIds(saved);
  const repPosts = await listApprovedPostsByIdsMerged(repIds);
  const needFallbackUserIds = [
    ...new Set(saved.filter((g) => !resolveRepresentativeContentPost(g, repPosts)).map((g) => g.user_id)),
  ];
  const fallbackByUserId = await getLatestApprovedPostsForGuardiansMergedBatch(needFallbackUserIds);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-text-strong text-xl font-semibold">{t("savedGuardiansTitle")}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{t("savedGuardiansLead")}</p>
      </div>
      {saved.length === 0 ? (
        <div className="border-border/60 rounded-2xl border border-dashed bg-muted/10 px-6 py-14 text-center">
          <p className="text-foreground text-sm font-semibold">{t("savedGuardiansEmptyTitle")}</p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t("savedGuardiansEmptyLead")}</p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href="/guardians">{t("savedGuardiansBrowse")}</Link>
          </Button>
        </div>
      ) : null}
      <ul className="grid gap-4 sm:grid-cols-2">
        {saved.map((g) => {
          const imgs = guardianProfileImageUrls(g);
          const fb = fallbackByUserId.get(g.user_id) ?? null;
          const repLines = representativePostLinesForSheetPreviewWithFallback(g, repPosts, fb);
          const repCtx = postContextFromGuardianRepresentativeWithFallback(g, repPosts, fb);
          const fromRep = resolveRepresentativeContentPost(g, repPosts) != null;
          const representativePostsSource =
            repLines.length === 0 ? undefined : !fromRep && fb ? ("recent_approved" as const) : ("curated" as const);
          return (
            <li key={g.user_id}>
              <Card className="overflow-hidden rounded-2xl border-border/60 py-0 shadow-[var(--shadow-sm)]">
                <div className="flex gap-4 p-4 sm:p-5">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl sm:size-24">
                    <Image src={imgs.avatar} alt="" fill className={GUARDIAN_AVATAR_COVER_CLASS} sizes="96px" />
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-2 p-0">
                    <p className="font-semibold leading-snug">{g.display_name}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={guardianTierBadgeVariant(g.guardian_tier)} className={cn(GUARDIAN_TIER_ROLE_BADGE_CLASSNAME)}>
                        {tTier(g.guardian_tier)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{g.headline}</p>
                    <TrustBadgesServer ids={g.trust_badge_ids} size="xs" />
                    {g.avg_traveler_rating != null ? (
                      <p className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                        {g.avg_traveler_rating.toFixed(1)}
                      </p>
                    ) : null}
                    <div className="border-border/50 mt-auto flex flex-col gap-2 border-t border-dashed pt-4 sm:flex-row sm:flex-wrap">
                      <MypageGuardianProfileSheetTrigger
                        guardian={{
                          user_id: g.user_id,
                          display_name: g.display_name,
                          headline: g.headline,
                          primary_region_slug: g.primary_region_slug,
                          guardian_tier: g.guardian_tier,
                          photo_url: g.photo_url,
                          avatar_image_url: g.avatar_image_url,
                          list_card_image_url: g.list_card_image_url,
                          detail_hero_image_url: g.detail_hero_image_url,
                          ...(repLines.length > 0
                            ? { representativePosts: repLines, representativePostsSource }
                            : {}),
                        }}
                        triggerLabel={t("openProfile")}
                        className="h-10 w-full sm:min-w-0 sm:flex-1"
                        postContext={repCtx}
                      />
                      <SavedGuardianRequestButton
                        className="h-10 w-full rounded-xl sm:min-w-0 sm:flex-1"
                        label={tReq("openCta")}
                        openDetail={{
                          guardianUserId: g.user_id,
                          displayName: g.display_name,
                          headline: g.headline,
                          avatarUrl: imgs.avatar,
                          suggestedRegionSlug: g.primary_region_slug,
                          ...(repCtx ?? {}),
                        }}
                      />
                    </div>
                  </CardContent>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
