import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { mockTravelerTripRequests } from "@/data/mock";
import { getTravelerSavedGuardianIdsUnified, getTravelerSavedPostIdsUnified } from "@/lib/traveler-saved-unified.server";
import { mockGuardians } from "@/data/mock";
import { isMockGuardianId } from "@/lib/dev/mock-guardian-auth";
import { TravelerOverviewStatGrid } from "@/components/mypage/mypage-traveler-overview-stat-grid";
import { TravelerMatchDetailSheetTrigger } from "@/components/mypage/traveler-match-detail-sheet";
import { TravelerTripRequestDetailSheetTrigger } from "@/components/mypage/traveler-trip-request-detail-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND } from "@/lib/constants";
import { resolveMypageSessionRole } from "@/lib/mypage-account.server";
import { getMypagePointsBundleCached } from "@/lib/points/mypage-points-data.server";
import { getServerSupabaseForUser, getSessionUserId, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { getMatchRequestsForTraveler } from "@/lib/traveler-match-requests.server";
import { getSubmittedTravelerReviewsFromCookie } from "@/lib/traveler-submitted-reviews.server";
import { ArrowRight, HeartHandshake, Sparkles, UserRound, Users } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return {
    title: `${t("metaTitle")} | ${BRAND.name}`,
    description: t("metaDescription"),
  };
}

export default async function TravelerOverviewPage() {
  const t = await getTranslations("TravelerHub");
  const userId = await getSessionUserId();
  let welcomeSubtitle = t("welcomeName");
  if (userId) {
    const sb = await getServerSupabaseForUser();
    if (sb) {
      const [{ data: prof }, { data: u }] = await Promise.all([
        sb.from("user_profiles").select("display_name").eq("user_id", userId).maybeSingle(),
        sb.from("users").select("legal_name, email").eq("id", userId).maybeSingle(),
      ]);
      const derived =
        prof?.display_name?.trim() || u?.legal_name?.trim() || (u?.email ? u.email.split("@")[0] : "") || "";
      if (derived) welcomeSubtitle = derived;
    }
  }

  const openRequests = mockTravelerTripRequests.filter((r) => r.status === "requested" || r.status === "reviewing");
  const travelerAuthId = await getSupabaseAuthUserIdOnly();
  const useMockTrips = !travelerAuthId || isMockGuardianId(travelerAuthId);
  const savedGuardianIds = await getTravelerSavedGuardianIdsUnified(userId);
  const savedG = savedGuardianIds.length;
  const savedPostIds = await getTravelerSavedPostIdsUnified(userId);
  const savedP = savedPostIds.length;
  const matchRows = travelerAuthId ? await getMatchRequestsForTraveler(travelerAuthId) : [];
  const openRequestsCount = useMockTrips ? openRequests.length : matchRows.filter((m) => m.status === "requested").length;
  const matchActive = matchRows.filter((m) => m.status === "accepted").length;
  const matchPending = matchRows.filter((m) => m.status === "requested").length;
  const recentMatches = matchRows.slice(0, 2);
  const { appRole } = await resolveMypageSessionRole();
  const submittedReviews = await getSubmittedTravelerReviewsFromCookie();
  const reviewedMatchIds = new Set<string>();
  for (const s of submittedReviews) {
    if (s.booking_id) reviewedMatchIds.add(s.booking_id);
    if (s.id) reviewedMatchIds.add(s.id);
  }
  const canWriteTravelerReview = appRole !== "guardian";

  const pointsBundle = userId ? await getMypagePointsBundleCached(userId) : null;
  const pointsLabel = pointsBundle
    ? `${pointsBundle.data.balance.toLocaleString()}P`
    : t("statPointsPlaceholder");

  return (
    <div className="space-y-8">
      <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-[var(--shadow-sm)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{t("welcomeLine")}</p>
            <p className="text-foreground mt-1 text-lg font-semibold">{welcomeSubtitle}</p>
          </div>
          <Button asChild className="rounded-xl">
            <Link href="/explore">
              {t("ctaExplore")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <TravelerOverviewStatGrid
        openRequestsCount={openRequestsCount}
        savedG={savedG}
        savedP={savedP}
        matchActive={matchActive}
        matchPending={matchPending}
        pointsLabel={pointsLabel}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="h-10 rounded-xl font-medium">
          <Link href="/mypage/journeys">{t("hubQuickJourneys")}</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-10 rounded-xl font-medium">
          <Link href="/mypage/matches">{t("hubQuickMatches")}</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-10 rounded-xl font-medium">
          <Link href="/mypage/profile" className="inline-flex items-center gap-2">
            <UserRound className="size-4" aria-hidden />
            {t("hubQuickProfile")}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-10 rounded-xl font-medium">
          <Link href="/guardians" className="inline-flex items-center gap-2">
            <Users className="size-4" aria-hidden />
            {t("hubQuickFindGuardian")}
          </Link>
        </Button>
      </div>

      <section aria-label={t("overviewRecentMatchesTitle")}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HeartHandshake className="text-primary size-4" aria-hidden />
            <h2 className="text-lg font-semibold">{t("overviewRecentMatchesTitle")}</h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-9 rounded-lg text-sm font-semibold">
            <Link href="/mypage/matches">{t("overviewRecentMatchesCta")}</Link>
          </Button>
        </div>
        {recentMatches.length === 0 ? (
          <Card className="rounded-2xl border-border/60 border-dashed py-0 shadow-none">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-sm leading-relaxed">{t("overviewRecentMatchesEmpty")}</p>
              <Button asChild variant="link" className="mt-2 h-auto px-0 text-sm font-semibold">
                <Link href="/guardians">{t("hubQuickFindGuardian")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {recentMatches.map((m) => (
              <li key={m.id}>
                <Card className="rounded-2xl border-border/60 py-0 shadow-none">
                  <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.guardian_display_name || m.guardian_user_id}</p>
                      <p className="text-muted-foreground text-xs">{t(`matchStatus.${m.status}`)}</p>
                    </div>
                    <TravelerMatchDetailSheetTrigger
                      row={m}
                      triggerLabel={t("details")}
                      alreadyReviewed={reviewedMatchIds.has(m.id)}
                      canWriteTravelerReview={canWriteTravelerReview}
                      className="rounded-xl shrink-0"
                    />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="text-primary size-4" aria-hidden />
          <h2 className="text-lg font-semibold">{t("snapshotTitle")}</h2>
        </div>
        <ul className="space-y-3">
          {(useMockTrips ? mockTravelerTripRequests.slice(0, 2) : []).map((r) => {
            const g = r.guardian_user_id ? mockGuardians.find((x) => x.user_id === r.guardian_user_id) : null;
            return (
              <li key={r.id}>
                <Card className="rounded-2xl border-border/60 py-0 shadow-none">
                  <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{t(`status.${r.status}`)}</p>
                      <p className="text-muted-foreground text-sm">{r.note}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {g?.display_name ?? t("noGuardianYet")} · {t(`region.${r.region_label_key}`)}
                      </p>
                    </div>
                    <TravelerTripRequestDetailSheetTrigger
                      request={r}
                      guardianLine={r.guardian_name ?? g?.display_name ?? t("noGuardianYet")}
                      regionLabel={t(`region.${r.region_label_key}`)}
                      triggerLabel={t("details")}
                    />
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <Card className="border-[var(--brand-trust-blue)]/25 from-[var(--brand-trust-blue-soft)]/40 rounded-2xl border-2 border-dashed bg-gradient-to-br to-card py-0 shadow-none">
        <CardContent className="space-y-4 p-6 sm:p-8">
          <div>
            <h2 className="text-text-strong text-lg font-semibold">{t("travelerEnticeTitle")}</h2>
            <p className="text-muted-foreground mt-2 max-w-xl text-[15px] leading-relaxed">{t("travelerEnticeBody")}</p>
          </div>
          <Button asChild size="lg" className="h-12 rounded-[var(--radius-md)] font-semibold">
            <Link href="/guardians/apply">{t("travelerEnticeCta")}</Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs leading-relaxed">{t("mvpNote")}</p>
    </div>
  );
}
