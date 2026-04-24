import type { GuardianProfile } from "@/types/domain";
import type { GuardianDashboardSnapshot } from "@/types/guardian-dashboard";
import { CONTRIBUTION_RULES } from "@/lib/constants";
import { guardianTierLabel } from "@/lib/guardian-tier-ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GuardianProgressRow } from "@/components/guardian/dashboard/guardian-progress-row";
import { Separator } from "@/components/ui/separator";

function nextTierCopy(profile: GuardianProfile): { title: string; bullets: string[] } {
  if (profile.guardian_tier === "contributor") {
    return {
      title: "Path to Active Guardian",
      bullets: [
        `Maintain ≥ ${CONTRIBUTION_RULES.activeGuardianRolling30d} approved posts per rolling ${CONTRIBUTION_RULES.windowDays} days.`,
        `Maintain ≥ ${CONTRIBUTION_RULES.activeGuardianMinPerWeek} approved posts per week on average.`,
        "Active tier reflects publishing cadence — it does not turn on trusted matching by itself.",
      ],
    };
  }
  if (profile.guardian_tier === "active_guardian") {
    return {
      title: "Path to Verified Guardian",
      bullets: [
        "Admin review of session quality, mutual reviews, and policy adherence.",
        "Trust checks and identity verification where required.",
        "Matching eligibility (`matching_enabled`) is toggled by operations — never auto from post count.",
      ],
    };
  }
  return {
    title: "Stay verified",
    bullets: [
      "Keep contribution cadence and editorial quality within program guidelines.",
      "Respond promptly to moderator notes and incident follow-ups.",
      "Trusted matching can be paused independently if trust signals slip.",
    ],
  };
}

export function GuardianTierStatusSection({
  profile,
  snapshot,
}: {
  profile: GuardianProfile;
  snapshot: GuardianDashboardSnapshot;
}) {
  const next = nextTierCopy(profile);
  const monthlyTarget = snapshot.monthly_approved_target;
  const weeklyTarget = snapshot.weekly_approved_target;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg font-semibold tracking-tight">Status & tier ladder</CardTitle>
          <Badge variant={profile.matching_enabled ? "default" : "outline"} className="font-medium">
            {profile.matching_enabled ? "Trusted matching eligible" : "Matching not enabled"}
          </Badge>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {/* TODO(prod): Supabase auth role check + server recomputed tier from `content_posts` / admin flags. */}
          You are a <span className="text-foreground font-medium">{guardianTierLabel(profile.guardian_tier)}</span>.
          Open contribution and trusted matching are intentionally separate lanes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div className="rounded-xl border border-dashed bg-muted/20 p-4">
          <p className="text-foreground font-medium">{next.title}</p>
          <ul className="text-muted-foreground mt-3 list-inside list-disc space-y-2 text-xs leading-relaxed">
            {next.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-foreground mb-4 font-medium">Contribution requirements (progress)</p>
          <div className="space-y-5">
            <GuardianProgressRow
              label={`Approved posts · rolling ${CONTRIBUTION_RULES.windowDays} days (ops standard)`}
              current={profile.posts_approved_last_30d}
              target={CONTRIBUTION_RULES.activeGuardianRolling30d}
            />
            <GuardianProgressRow
              label="Approved posts · this calendar month (mock dashboard)"
              current={snapshot.posts_approved_this_month}
              target={monthlyTarget}
            />
            <GuardianProgressRow
              label="Approved posts · current week (rolling mock)"
              current={profile.posts_approved_last_7d}
              target={weeklyTarget}
            />
          </div>
        </div>

        <Separator />

        <p className="text-muted-foreground text-xs leading-relaxed">
          Verified status requires admin review and trust checks. Hitting post targets alone does not unlock
          trusted matching — operations enable `matching_enabled` after policy review.
        </p>
      </CardContent>
    </Card>
  );
}
