import Link from "next/link";
import type { GuardianActivityLog } from "@/types/domain";
import type { GuardianDashboardSnapshot } from "@/types/guardian-dashboard";
import { GuardianMetricTile } from "@/components/guardian/dashboard/guardian-metric-tile";
import { GuardianProgressRow } from "@/components/guardian/dashboard/guardian-progress-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function GuardianContributionSection({
  snapshot,
  activityLogs,
  exploreHref,
  postsApprovedLast7d,
}: {
  snapshot: GuardianDashboardSnapshot;
  activityLogs: GuardianActivityLog[];
  exploreHref: string;
  postsApprovedLast7d: number;
}) {
  const recent = [...activityLogs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold tracking-tight">Contribution activity</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {/* TODO(prod): Content management integration — live counts from `content_posts` + moderation queue. */}
          Publishing cadence builds reputation; admins still gate matching and spotlight separately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <GuardianMetricTile
            label="Submitted (month)"
            value={snapshot.posts_submitted_this_month}
            hint="Includes pending review"
          />
          <GuardianMetricTile
            label="Approved (month)"
            value={snapshot.posts_approved_this_month}
            hint="Counts toward tier signals"
          />
          <GuardianMetricTile
            label="Pending review"
            value={snapshot.posts_pending_review}
            hint="Editorial queue (mock)"
          />
          <GuardianMetricTile
            label="Weekly streak"
            value={`${snapshot.contribution_streak_weeks} wk`}
            hint="Weeks meeting ≥ weekly target (mock)"
          />
        </div>

        <div className="rounded-xl border bg-muted/20 p-4">
          <GuardianProgressRow
            label="Weekly approved progress (rolling 7 days)"
            current={postsApprovedLast7d}
            target={snapshot.weekly_approved_target}
          />
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            {/* TODO(prod): Replace with ISO-week approved counts from DB. */}
            Rolling window matches the Active Guardian weekly minimum in program rules.
          </p>
        </div>

        {snapshot.category_counts.length > 0 ? (
          <div>
            <p className="text-foreground mb-3 text-sm font-medium">Categories you have posted (mock)</p>
            <div className="flex flex-wrap gap-2">
              {snapshot.category_counts.map((c) => (
                <span
                  key={c.label}
                  className="bg-muted/60 text-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
                >
                  {c.label}
                  <span className="text-muted-foreground tabular-nums">{c.count}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-xl">
              <Link href="/mypage/guardian/posts/new">Create route post</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/mypage/guardian/posts">My posts</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={exploreHref}>Explore regions</Link>
            </Button>
          </div>
          <p className="text-muted-foreground max-w-md text-xs leading-relaxed">
            Route posts pair map + stops with your voice — quality and moderation still gate matching.
          </p>
        </div>

        <Separator />

        <div>
          <p className="text-foreground mb-3 text-sm font-medium">Recent activity</p>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity rows yet (mock).</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {recent.slice(0, 8).map((l) => (
                <li
                  key={l.id}
                  className="border-border/60 flex flex-col gap-1 rounded-lg border bg-muted/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-foreground font-medium capitalize">
                    {l.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {l.detail ?? "—"} · {new Date(l.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            {/* TODO(prod): Map to `guardian_activity_logs` + CMS events. */}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
