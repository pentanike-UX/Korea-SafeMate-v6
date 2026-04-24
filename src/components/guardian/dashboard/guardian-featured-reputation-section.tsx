"use client";

import type { GuardianProfile } from "@/types/domain";
import type { GuardianDashboardSnapshot } from "@/types/guardian-dashboard";
import { useTranslations } from "next-intl";
import { MypageSelfGuardianPreviewSheet } from "@/components/mypage/mypage-self-guardian-preview-sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function GuardianFeaturedReputationSection({
  profile,
  snapshot,
}: {
  profile: GuardianProfile;
  snapshot: GuardianDashboardSnapshot;
}) {
  const t = useTranslations("TravelerHub");

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg font-semibold tracking-tight">Featured & reputation</CardTitle>
          {profile.featured ? (
            <Badge variant="featured" className="font-medium">
              Featured guardian
            </Badge>
          ) : null}
          {profile.influencer_seed ? (
            <Badge variant="outline" className="font-medium">
              Influencer seed
            </Badge>
          ) : null}
        </div>
        <CardDescription className="text-sm leading-relaxed">
          Spotlight and program seed labels are curated — they are not unlocked by post count alone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div className="rounded-xl border border-dashed border-[color-mix(in_srgb,var(--brand-primary)_28%,var(--border-default))] bg-gradient-to-br from-[var(--brand-primary-soft)]/80 via-[var(--brand-trust-blue-soft)]/40 to-muted/20 p-5 shadow-[var(--shadow-sm)]">
          <p className="text-foreground font-semibold">{snapshot.featured_spotlight.headline}</p>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{snapshot.featured_spotlight.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={snapshot.featured_spotlight.eligible ? "default" : "outline"}>
              {snapshot.featured_spotlight.eligible ? "Pool eligible (mock)" : "Not yet eligible"}
            </Badge>
          </div>
        </div>

        {snapshot.quality_indicators.length > 0 ? (
          <div>
            <p className="text-foreground mb-3 text-sm font-medium">Contribution quality signals (mock)</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {snapshot.quality_indicators.map((q) => (
                <div
                  key={q.label}
                  className="border-border/60 rounded-lg border bg-muted/10 px-3 py-2 text-center"
                >
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                    {q.label}
                  </p>
                  <p className="text-foreground mt-1 text-sm font-semibold tabular-nums">{q.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Public directory reflects your contributor identity — keep intel accurate and scoped honestly.
          </p>
          <MypageSelfGuardianPreviewSheet
            triggerLabel={t("guardianDashPublicProfileCta")}
            variant="outline"
            size="sm"
            triggerClassName="rounded-lg shrink-0"
          />
        </div>
      </CardContent>
    </Card>
  );
}
