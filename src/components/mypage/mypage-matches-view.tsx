import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppAccountRole } from "@/lib/auth/app-role";
import type { StoredMatchRequest } from "@/lib/traveler-match-requests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockAttentionBadge } from "@/components/mypage/mypage-attention-primitives";
import { MypageBlockSeenBoundary } from "@/components/mypage/mypage-block-seen-boundary";
import type { AttentionBlockKey } from "@/types/mypage-hub";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MypageMatchesEmpty } from "@/components/mypage/mypage-matches-empty";
import { MypageTravelerReviewsInboundSeenBoundary } from "@/components/mypage/mypage-traveler-reviews-inbound-seen-boundary";
import { MypageMatchRowActions } from "@/components/mypage/mypage-match-row-actions";
import { matchStatusChipClass } from "@/lib/mypage-status-badge";

export async function MypageMatchesView({
  appRole,
  items,
  hasTravelerSession,
  reviewedMatchIds = [],
}: {
  appRole: AppAccountRole;
  items: StoredMatchRequest[];
  hasTravelerSession: boolean;
  reviewedMatchIds?: string[];
}) {
  const t = await getTranslations("TravelerHub");

  const pending = items.filter((r) => r.status === "requested");
  const active = items.filter((r) => r.status === "accepted");
  const done = items.filter((r) => r.status === "completed");
  const reviewedSet = new Set(reviewedMatchIds);
  const reviewDue = done.filter((r) => !reviewedSet.has(r.id)).length;

  if (!hasTravelerSession) {
    if (appRole === "guardian") {
      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl">{t("matchesPageTitle")}</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-[15px] leading-relaxed">{t("matchesPageLead")}</p>
          </div>
          <Card className="border-border/60 rounded-2xl">
            <CardContent className="space-y-4 p-6">
              <p className="text-muted-foreground text-sm leading-relaxed">{t("matchesGuardianOnlySession")}</p>
              <Button asChild className="h-11 rounded-xl font-semibold">
                <Link href="/mypage/guardian/matches">{t("matchesOpenGuardianMatches")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl">{t("matchesPageTitle")}</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-[15px] leading-relaxed">{t("matchesPageLead")}</p>
        </div>
        <Card className="border-border/60 rounded-2xl">
          <CardContent className="space-y-4 p-6">
            <p className="text-muted-foreground text-sm leading-relaxed">{t("matchesNeedLogin")}</p>
            <Button asChild className="h-11 rounded-xl font-semibold">
              <Link href="/login">{t("goLogin")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canWriteTravelerReview = appRole !== "guardian";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl">{t("matchesPageTitle")}</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-[15px] leading-relaxed">{t("matchesPageLead")}</p>
        <p className="mt-3 text-sm">
          <Link href="/mypage/requests" className="text-primary inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
            {t("matchesSeeTripRequests")}
          </Link>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <CardDescription>{t("matchesSummaryActive")}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{active.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <CardDescription>{t("matchesSummaryPending")}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{pending.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <CardDescription>{t("matchesSummaryCompleted")}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{done.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {items.length === 0 ? (
        <MypageMatchesEmpty appRole={appRole} />
      ) : (
        <div className="space-y-8">
          <MatchSection
            title={t("matchesSectionActive")}
            attentionCount={active.length}
            attentionAria={t("attentionBlockMatchesActive")}
            rows={active}
            t={t}
            showComplete
            reviewedMatchIds={reviewedMatchIds}
            canWriteTravelerReview={canWriteTravelerReview}
          />
          <MatchSection
            title={t("matchesSectionPending")}
            attentionCount={pending.length}
            attentionAria={t("attentionBlockMatchesPending")}
            rows={pending}
            t={t}
            showComplete={false}
            reviewedMatchIds={reviewedMatchIds}
            canWriteTravelerReview={canWriteTravelerReview}
            attentionBlockKey="traveler.matches.newResponses"
          />
          <MatchSection
            title={t("matchesSectionCompleted")}
            attentionCount={reviewDue}
            attentionAria={t("attentionBlockMatchesReview")}
            rows={done}
            t={t}
            showComplete={false}
            reviewedMatchIds={reviewedMatchIds}
            canWriteTravelerReview={canWriteTravelerReview}
            attentionBlockKey="traveler.matches.reviewDue"
            wrapWithReviewsInboundBoundary
          />
        </div>
      )}
    </div>
  );
}

function MatchSection({
  title,
  attentionCount,
  attentionAria,
  rows,
  t,
  showComplete,
  reviewedMatchIds,
  canWriteTravelerReview,
  attentionBlockKey,
  wrapWithReviewsInboundBoundary,
}: {
  title: string;
  attentionCount: number;
  attentionAria: string;
  rows: StoredMatchRequest[];
  t: Awaited<ReturnType<typeof getTranslations>>;
  showComplete: boolean;
  reviewedMatchIds: string[];
  canWriteTravelerReview: boolean;
  attentionBlockKey?: AttentionBlockKey;
  /** 인바운드 리뷰 블록(`traveler.reviews.newInbound`) 후보 — 시그니처가 0이면 관측만 스킵 */
  wrapWithReviewsInboundBoundary?: boolean;
}) {
  if (rows.length === 0) return null;
  const section = (
    <section className="space-y-3">
      <h3 className="text-foreground flex flex-wrap items-center gap-2 text-sm font-semibold">
        {title}
        <BlockAttentionBadge count={attentionCount} ariaLabel={attentionAria} />
      </h3>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id}>
            <Card className="border-border/60 rounded-2xl py-0 shadow-[var(--shadow-sm)]">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground font-medium">
                      {r.guardian_display_name || r.guardian_user_id}
                    </p>
                    <Badge variant="outline" className={`text-[10px] font-semibold ${matchStatusChipClass(r.status)}`}>
                      {t(`matchStatus.${r.status}`)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground font-mono text-[11px] break-all">{r.id}</p>
                </div>
                <MypageMatchRowActions
                  row={r}
                  showComplete={showComplete}
                  reviewedMatchIds={reviewedMatchIds}
                  canWriteTravelerReview={canWriteTravelerReview}
                />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
  if (attentionBlockKey) {
    const wrapped = <MypageBlockSeenBoundary blockKey={attentionBlockKey}>{section}</MypageBlockSeenBoundary>;
    if (wrapWithReviewsInboundBoundary) {
      return <MypageTravelerReviewsInboundSeenBoundary>{wrapped}</MypageTravelerReviewsInboundSeenBoundary>;
    }
    return wrapped;
  }
  return section;
}
