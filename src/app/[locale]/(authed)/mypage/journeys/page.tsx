import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";
import { getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { getMatchRequestsForTraveler } from "@/lib/traveler-match-requests.server";
import { MypageJourneysMatchHubBadge, MypageJourneysOpenTripBadge } from "@/components/mypage/mypage-journeys-attention-badges";
import { MypageJourneysSeenCard } from "@/components/mypage/mypage-journeys-seen-card";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { MypageHubCard, MypageHubCardContent, MypageHubCardHeader } from "@/components/mypage/mypage-hub-card";
import { Bookmark, Heart, HeartHandshake, History, Plane } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return { title: `${t("journeysTitle")} | ${BRAND.name}` };
}

export default async function MypageJourneysPage() {
  const t = await getTranslations("TravelerHub");
  const travelerId = await getSupabaseAuthUserIdOnly();
  const matches = travelerId ? await getMatchRequestsForTraveler(travelerId) : [];
  const matchCount = matches.length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl">{t("journeysTitle")}</h2>
        <p className="text-muted-foreground mt-2 max-w-xl text-[15px] leading-relaxed">{t("journeysLead")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MypageJourneysSeenCard blockKey="traveler.journeys.openTrips">
          <MypageHubCard className="h-full">
            <MypageHubCardHeader>
              <Plane className="text-primary size-8" strokeWidth={1.5} aria-hidden />
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{t("navRequests")}</CardTitle>
                <MypageJourneysOpenTripBadge />
              </div>
              <CardDescription>{t("journeysCardRequests")}</CardDescription>
            </MypageHubCardHeader>
            <MypageHubCardContent className="space-y-0">
              <Button asChild className="w-full rounded-xl font-semibold">
                <Link href="/mypage/requests">{t("viewAll")}</Link>
              </Button>
            </MypageHubCardContent>
          </MypageHubCard>
        </MypageJourneysSeenCard>
        <MypageJourneysSeenCard blockKey="traveler.journeys.savedGuardians">
          <MypageHubCard className="h-full">
            <MypageHubCardHeader>
              <Heart className="text-primary size-8" strokeWidth={1.5} aria-hidden />
              <CardTitle className="text-lg">{t("navSavedGuardians")}</CardTitle>
              <CardDescription>{t("journeysCardGuardians")}</CardDescription>
            </MypageHubCardHeader>
            <MypageHubCardContent className="space-y-0">
              <Button asChild className="w-full rounded-xl font-semibold">
                <Link href="/mypage/saved-guardians">{t("viewAll")}</Link>
              </Button>
            </MypageHubCardContent>
          </MypageHubCard>
        </MypageJourneysSeenCard>
        <MypageJourneysSeenCard blockKey="traveler.journeys.savedPosts">
          <MypageHubCard className="h-full">
            <MypageHubCardHeader>
              <Bookmark className="text-primary size-8" strokeWidth={1.5} aria-hidden />
              <CardTitle className="text-lg">{t("navSavedPosts")}</CardTitle>
              <CardDescription>{t("journeysCardPosts")}</CardDescription>
            </MypageHubCardHeader>
            <MypageHubCardContent className="space-y-0">
              <Button asChild className="w-full rounded-xl font-semibold">
                <Link href="/mypage/saved-posts">{t("viewAll")}</Link>
              </Button>
            </MypageHubCardContent>
          </MypageHubCard>
        </MypageJourneysSeenCard>
        <MypageHubCard className="h-full">
          <MypageHubCardHeader>
            <History className="text-primary size-8" strokeWidth={1.5} aria-hidden />
            <CardTitle className="text-lg">{t("navActivity")}</CardTitle>
            <CardDescription>{t("journeysCardActivity")}</CardDescription>
          </MypageHubCardHeader>
          <MypageHubCardContent className="space-y-0">
            <Button asChild className="w-full rounded-xl font-semibold">
              <Link href="/mypage/activity">{t("viewAll")}</Link>
            </Button>
          </MypageHubCardContent>
        </MypageHubCard>
        <MypageJourneysSeenCard blockKeys={["traveler.matches.newResponses", "traveler.matches.reviewDue"]}>
          <MypageHubCard className="h-full sm:col-span-2 lg:col-span-1">
            <MypageHubCardHeader>
              <HeartHandshake className="text-primary size-8" strokeWidth={1.5} aria-hidden />
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{t("navMatches")}</CardTitle>
                <MypageJourneysMatchHubBadge />
              </div>
              <CardDescription>{t("journeysCardMatches")}</CardDescription>
            </MypageHubCardHeader>
            <MypageHubCardContent>
              <p className="text-text-strong text-2xl font-semibold tabular-nums">{matchCount}</p>
              <Button asChild className="w-full rounded-xl font-semibold">
                <Link href="/mypage/matches">{t("viewAll")}</Link>
              </Button>
            </MypageHubCardContent>
          </MypageHubCard>
        </MypageJourneysSeenCard>
      </div>
    </div>
  );
}
