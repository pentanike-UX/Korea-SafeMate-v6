import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MypagePointsDetailSheetTrigger } from "@/components/mypage/mypage-points-detail-sheet";
import { MypagePointsPageSeenBoundary } from "@/components/mypage/mypage-points-page-seen-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/constants";
import { getMypagePointsBundleCached } from "@/lib/points/mypage-points-data.server";
import { getSessionUserId } from "@/lib/supabase/server-user";
import { Coins, Info } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("TravelerPoints");
  return {
    title: `${t("metaTitle")} | ${BRAND.name}`,
    description: t("metaDescription"),
  };
}

function formatPlainP(n: number) {
  return `${n.toLocaleString()}P`;
}

export default async function TravelerPointsPage() {
  const t = await getTranslations("TravelerPoints");
  const th = await getTranslations("TravelerHub");
  const userId = await getSessionUserId();

  if (!userId) {
    return (
      <div className="space-y-6">
        <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
          <CardHeader>
            <CardTitle className="text-lg">{t("needLoginTitle")}</CardTitle>
            <CardDescription>{t("needLoginLead")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-xl font-semibold">
              <Link href="/login">{t("goLogin")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data, api: pointsApiPayload } = await getMypagePointsBundleCached(userId);
  const { balance, earned, revoked, ledger, policy } = data;

  return (
    <MypagePointsPageSeenBoundary className="space-y-8">
      <div>
        <h2 className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl">{t("title")}</h2>
        <p className="text-muted-foreground mt-2 max-w-xl text-[15px] leading-relaxed">{t("lead")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 rounded-2xl border-[color-mix(in_srgb,var(--brand-primary)_22%,var(--border))] bg-[color-mix(in_srgb,var(--brand-primary-soft)_55%,var(--card))] py-0 shadow-[var(--shadow-sm)] sm:col-span-1">
          <CardContent className="flex flex-col gap-3 p-6 sm:p-7">
            <div className="flex items-center gap-2">
              <Coins className="text-primary size-5" strokeWidth={1.75} aria-hidden />
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{t("cardBalance")}</p>
            </div>
            <p className="text-text-strong text-4xl font-semibold tabular-nums tracking-tight sm:text-[2.75rem]">
              {formatPlainP(balance)}
            </p>
            <p className="text-muted-foreground text-sm leading-snug">{t("cardBalanceHint")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 rounded-2xl py-0 shadow-[var(--shadow-sm)]">
          <CardContent className="p-6 sm:p-7">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{t("cardLifetimeEarned")}</p>
            <p className="text-text-strong mt-3 text-2xl font-semibold tabular-nums">{formatPlainP(earned)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 rounded-2xl py-0 shadow-[var(--shadow-sm)]">
          <CardContent className="p-6 sm:p-7">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{t("cardLifetimeRevoked")}</p>
            <p className="text-text-strong mt-3 text-2xl font-semibold tabular-nums">{formatPlainP(revoked)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 rounded-2xl border-dashed py-0 shadow-[var(--shadow-sm)]">
        <CardContent className="flex gap-3 p-5 sm:p-6">
          <Info className="text-muted-foreground mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-semibold">{t("spendComingTitle")}</p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{t("spendComingBody")}</p>
            {policy ? (
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                {t("policySummaryLine", {
                  profile: policy.profile_signup_reward,
                  post: policy.post_publish_reward,
                  match: policy.match_complete_reward,
                })}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 rounded-2xl py-0 shadow-[var(--shadow-sm)]">
        <CardContent className="space-y-4 p-6 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-text-strong text-base font-semibold tracking-tight">{t("historyTitle")}</h3>
              <p className="text-muted-foreground mt-1 max-w-lg text-sm leading-relaxed">
                {ledger.length === 0 ? t("pageHistoryTeaserEmpty") : t("pageHistoryTeaserHasRows", { count: ledger.length })}
              </p>
            </div>
            <MypagePointsDetailSheetTrigger
              initialPointsPayload={pointsApiPayload}
              triggerLabel={t("pageDetailSheetCta")}
              variant="default"
              size="default"
              className="w-full shrink-0 rounded-xl font-semibold sm:w-auto"
            />
          </div>
          {ledger.length === 0 ? (
            <div className="flex flex-wrap gap-2 border-border/60 border-t pt-4">
              <Button asChild variant="outline" size="sm" className="rounded-xl font-semibold">
                <Link href="/mypage/matches">{th("hubQuickMatches")}</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl font-semibold">
                <Link href="/guardians">{th("hubQuickFindGuardian")}</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </MypagePointsPageSeenBoundary>
  );
}
