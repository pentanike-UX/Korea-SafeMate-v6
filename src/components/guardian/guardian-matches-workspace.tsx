import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  GuardianMatchesActiveBadge,
  GuardianMatchesPendingBadge,
} from "@/components/mypage/mypage-guardian-matches-attention-badges";
import { MypageBlockSeenBoundary } from "@/components/mypage/mypage-block-seen-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GuardianMatchDetailSheetTrigger } from "@/components/mypage/guardian-match-detail-sheet";
import { GUARDIAN_WORKSPACE } from "@/lib/mypage/guardian-workspace-routes";
import type { StoredMatchRequest } from "@/lib/traveler-match-requests";
import { getMatchRequestsForGuardian } from "@/lib/traveler-match-requests.server";
import { matchStatusChipClass } from "@/lib/mypage-status-badge";

export async function GuardianMatchesWorkspace({ guardianId }: { guardianId: string }) {
  const t = await getTranslations("TravelerHub");
  const items = await getMatchRequestsForGuardian(guardianId);

  const pending = items.filter((r) => r.status === "requested");
  const active = items.filter((r) => r.status === "accepted");
  const done = items.filter((r) => r.status === "completed");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-text-strong text-2xl font-semibold tracking-tight">{t("guardianMatchesPageTitle")}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">{t("guardianMatchesPageLead")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MypageBlockSeenBoundary blockKey="guardian.matches.newRequests">
          <Card className="border-border/60 h-full rounded-2xl shadow-[var(--shadow-sm)]">
            <CardContent className="p-5 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{t("matchesSummaryPending")}</p>
                <GuardianMatchesPendingBadge count={pending.length} />
              </div>
              <p className="text-text-strong mt-2 text-2xl font-semibold tabular-nums">{pending.length}</p>
            </CardContent>
          </Card>
        </MypageBlockSeenBoundary>
        <MypageBlockSeenBoundary blockKey="guardian.matches.activeProgress">
          <Card className="border-border/60 h-full rounded-2xl shadow-[var(--shadow-sm)]">
            <CardContent className="p-5 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{t("matchesSummaryActive")}</p>
                <GuardianMatchesActiveBadge count={active.length} />
              </div>
              <p className="text-text-strong mt-2 text-2xl font-semibold tabular-nums">{active.length}</p>
            </CardContent>
          </Card>
        </MypageBlockSeenBoundary>
        <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
          <CardContent className="p-5 pt-6">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{t("matchesSummaryCompleted")}</p>
            <p className="text-text-strong mt-2 text-2xl font-semibold tabular-nums">{done.length}</p>
          </CardContent>
        </Card>
      </div>

      {items.length === 0 ? (
        <Card className="border-border/60 rounded-2xl border-dashed">
          <CardContent className="space-y-4 p-8 text-center">
            <p className="text-muted-foreground text-sm leading-relaxed">{t("guardianMatchesEmpty")}</p>
            <Button asChild variant="outline" className="rounded-xl font-semibold">
              <Link href={GUARDIAN_WORKSPACE.posts}>{t("emptyMatchesGuardianCtaPosts")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 ? (
            <MypageBlockSeenBoundary blockKey="guardian.matches.newRequests">
              <ul className="space-y-3">
                {pending.map((r) => (
                  <GuardianMatchRow key={r.id} r={r} t={t} />
                ))}
              </ul>
            </MypageBlockSeenBoundary>
          ) : null}
          {active.length > 0 ? (
            <MypageBlockSeenBoundary blockKey="guardian.matches.activeProgress">
              <ul className="space-y-3">
                {active.map((r) => (
                  <GuardianMatchRow key={r.id} r={r} t={t} />
                ))}
              </ul>
            </MypageBlockSeenBoundary>
          ) : null}
          {done.length > 0 ? (
            <ul className="space-y-3">
              {done.map((r) => (
                <GuardianMatchRow key={r.id} r={r} t={t} />
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}

function GuardianMatchRow({ r, t }: { r: StoredMatchRequest; t: Awaited<ReturnType<typeof getTranslations>> }) {
  return (
    <li>
      <Card className="border-border/60 rounded-2xl py-0 shadow-[var(--shadow-sm)]">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-foreground text-sm font-medium">
                {t("guardianMatchesTravelerLabel")} ·{" "}
                <span className="font-mono text-xs break-all">{r.traveler_user_id}</span>
              </p>
              <Badge variant="outline" className={`text-[10px] font-semibold ${matchStatusChipClass(r.status)}`}>
                {t(`matchStatus.${r.status}`)}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-[11px] break-all">{r.id}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <GuardianMatchDetailSheetTrigger row={r} />
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
