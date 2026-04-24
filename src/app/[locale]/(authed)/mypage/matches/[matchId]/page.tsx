import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { MypageMatchDetailActions } from "@/components/mypage/mypage-match-detail-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveMypageSessionRole } from "@/lib/mypage-account.server";
import { getMatchRequestsForTraveler } from "@/lib/traveler-match-requests.server";
import { getSubmittedTravelerReviewsFromCookie } from "@/lib/traveler-submitted-reviews.server";
import { getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";

type Props = { params: Promise<{ matchId: string }> };

function statusVariant(s: "requested" | "accepted" | "completed"): "default" | "secondary" | "outline" {
  if (s === "completed") return "secondary";
  if (s === "accepted") return "default";
  return "outline";
}

export default async function MypageMatchDetailPage({ params }: Props) {
  const { matchId } = await params;
  const travelerId = await getSupabaseAuthUserIdOnly();
  if (!travelerId) notFound();

  const items = await getMatchRequestsForTraveler(travelerId);
  const match = items.find((m) => m.id === matchId);
  if (!match) notFound();

  const { appRole } = await resolveMypageSessionRole();
  const submitted = await getSubmittedTravelerReviewsFromCookie();
  const alreadyReviewed = submitted.some((r) => r.booking_id === matchId);
  const canWriteTravelerReview = appRole !== "guardian";

  const t = await getTranslations("TravelerHub");
  const locale = await getLocale();
  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";

  function fmt(iso: string) {
    try {
      return new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/mypage/matches"
          className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
        >
          ← {t("matchDetailBack")}
        </Link>
        <h2 className="text-text-strong mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{t("matchDetailTitle")}</h2>
      </div>

      <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
        <CardHeader className="space-y-3 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg sm:text-xl">
              {match.guardian_display_name || match.guardian_user_id}
            </CardTitle>
            <Badge variant={statusVariant(match.status)} className="text-[10px] font-semibold">
              {t(`matchStatus.${match.status}`)}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-[11px] break-all">{match.id}</p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="text-muted-foreground grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-foreground font-medium">{t("matchDetailCreated")}</dt>
              <dd className="mt-0.5 tabular-nums">{fmt(match.created_at)}</dd>
            </div>
            <div>
              <dt className="text-foreground font-medium">{t("matchDetailUpdated")}</dt>
              <dd className="mt-0.5 tabular-nums">{fmt(match.updated_at)}</dd>
            </div>
          </dl>
          <MypageMatchDetailActions
            row={match}
            canWriteTravelerReview={canWriteTravelerReview}
            alreadyReviewed={alreadyReviewed}
          />
        </CardContent>
      </Card>
    </div>
  );
}
