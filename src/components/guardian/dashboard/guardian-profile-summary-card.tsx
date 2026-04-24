import { getTranslations } from "next-intl/server";
import type { GuardianProfile } from "@/types/domain";
import { guardianApprovalLabel, guardianApprovalVariant } from "@/lib/booking-ui";
import { guardianProfileCompleteness, formatGuardianLanguages } from "@/lib/guardian-dashboard-utils";
import { regionDisplayLabelFromSlug } from "@/lib/mypage/region-label-i18n";
import { GUARDIAN_TIER_ROLE_BADGE_CLASSNAME, guardianTierBadgeVariant, guardianTierLabel } from "@/lib/guardian-tier-ui";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GuardianProgressRow } from "@/components/guardian/dashboard/guardian-progress-row";

export async function GuardianProfileSummaryCard({ profile }: { profile: GuardianProfile }) {
  const complete = guardianProfileCompleteness(profile);
  const t = await getTranslations("TravelerHub");
  const primaryRegionLabel = regionDisplayLabelFromSlug(profile.primary_region_slug, (k) => t(k));

  return (
    <Card className="border-border/80 shadow-[var(--shadow-sm)] ring-1 ring-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)]">
      <CardHeader className="space-y-3">
        <div className="space-y-2">
          <CardTitle className="text-xl font-semibold tracking-tight">{profile.display_name}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={guardianTierBadgeVariant(profile.guardian_tier)} className={cn(GUARDIAN_TIER_ROLE_BADGE_CLASSNAME)}>
              {guardianTierLabel(profile.guardian_tier)}
            </Badge>
            <Badge variant={guardianApprovalVariant(profile.approval_status)} className="font-medium capitalize">
              {guardianApprovalLabel(profile.approval_status)}
            </Badge>
          </div>
          <CardDescription className="text-sm">{profile.headline}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Primary area</p>
            <p className="text-foreground mt-1">{primaryRegionLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Languages</p>
            <p className="text-foreground mt-1 leading-relaxed">{formatGuardianLanguages(profile.languages)}</p>
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Introduction</p>
          <p className="text-foreground mt-1 leading-relaxed">{profile.bio}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-gradient-to-br from-[var(--brand-trust-blue-soft)]/50 to-muted/25 p-4">
          <GuardianProgressRow label="Profile completeness" current={complete} target={100} suffix="%" />
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            {/* TODO(prod): Content management integration — sync bio, tags, and media from editor. */}
            Stronger profiles help travelers and admins understand your support style before matching.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
