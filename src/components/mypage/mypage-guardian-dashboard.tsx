"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { GuardianProfileStatus } from "@/lib/auth/guardian-profile-status";
import { GUARDIAN_WORKSPACE } from "@/lib/mypage/guardian-workspace-routes";
import { useMypageHubContext } from "@/components/mypage/mypage-hub-context";
import { BlockAttentionBadge } from "@/components/mypage/mypage-attention-primitives";
import { MypageBlockSeenBoundary } from "@/components/mypage/mypage-block-seen-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Heart, Pencil, Shield, Wallet } from "lucide-react";
import { MypagePointsDetailSheetTrigger } from "@/components/mypage/mypage-points-detail-sheet";
import { MypageSelfGuardianPreviewSheet } from "@/components/mypage/mypage-self-guardian-preview-sheet";

function formatPostUpdated(iso: string, locale: string) {
  try {
    const tag = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";
    return new Date(iso).toLocaleDateString(tag, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function MypageGuardianDashboard({ status }: { status: GuardianProfileStatus }) {
  const t = useTranslations("TravelerHub");
  const locale = useLocale();
  const hub = useMypageHubContext();
  const ops = hub?.snapshot.guardianOps;
  const uid = hub?.accountUserId;
  const recentPosts = ops?.recentPosts ?? [];

  const primaryCta = (href: string, label: string) => (
    <Button asChild size="lg" className="mt-4 h-12 w-full max-w-sm rounded-[var(--radius-md)] font-semibold sm:w-auto">
      <Link href={href}>{label}</Link>
    </Button>
  );

  if (status === "none") {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <Badge variant="outline" className="mb-2 w-fit">
              {t("guardianStatus.none")}
            </Badge>
            <CardTitle className="text-xl">{t("guardianDashNoneTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-[15px] leading-relaxed">
            <p className="text-muted-foreground">{t("guardianDashNoneLead")}</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
              <li>{t("guardianDashNoneBenefit1")}</li>
              <li>{t("guardianDashNoneBenefit2")}</li>
              <li>{t("guardianDashNoneBenefit3")}</li>
            </ul>
            {primaryCta("/guardians/apply", t("guardianCtaNone"))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "draft") {
    return (
      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
        <CardHeader className="pb-2">
          <Badge variant="secondary" className="mb-2 w-fit">
            {t("guardianStatus.draft")}
          </Badge>
          <CardTitle className="text-xl">{t("guardianDashDraftTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-[15px] leading-relaxed">{t("guardianDashDraftLead")}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{t("guardianDashDraftProgressLabel")}</span>
              <span className="text-muted-foreground">{t("guardianDashDraftProgressValue")}</span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div className="bg-[var(--brand-trust-blue)] h-full w-[40%] rounded-full" aria-hidden />
            </div>
          </div>
          {primaryCta("/guardian/onboarding", t("guardianCtaDraft"))}
        </CardContent>
      </Card>
    );
  }

  if (status === "submitted") {
    return (
      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
        <CardHeader className="pb-2">
          <Badge variant="trust" className="mb-2 w-fit">
            {t("guardianStatus.submitted")}
          </Badge>
          <CardTitle className="text-xl">{t("guardianDashSubmittedTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-[15px] leading-relaxed">{t("guardianDashSubmittedLead")}</p>
          <p className="text-muted-foreground border-border/60 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
            {t("guardianDashSubmittedSummary")}
          </p>
          {primaryCta("/guardian/profile", t("guardianCtaSubmitted"))}
          <p className="text-muted-foreground text-xs leading-relaxed">{t("guardianCtaSubmittedHint")}</p>
        </CardContent>
      </Card>
    );
  }

  if (status === "approved") {
    const pendingPosts = ops?.pendingPosts ?? 0;
    const draftPosts = ops?.draftPosts ?? 0;
    const reviewingBookings = ops?.reviewingBookings ?? 0;
    const inProgressBookings = ops?.inProgressBookings ?? 0;
    const completedBookings = ops?.completedBookings ?? 0;
    const openPool = ops?.openPoolCount ?? 0;
    const pointsLabel = ops?.points != null ? String(ops.points) : "—";
    const ub = hub?.attention.unreadBlockBadges;
    const gAttn = hub?.snapshot.guardianWorkspaceBlockAttention;
    const pointsRecent = gAttn?.pointsRecentLedgerCount ?? 0;
    const uPosts =
      (ub?.["guardian.posts.pendingReview"] ?? 0) + (ub?.["guardian.posts.drafts"] ?? 0);

    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
            <div>
              <Badge variant="featured" className="mb-2 w-fit">
                {t("guardianStatus.approved")}
              </Badge>
              <CardTitle className="text-xl">{t("guardianDashApprovedHubTitle")}</CardTitle>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">{t("guardianDashApprovedHubLead")}</p>
            </div>
            {uid ? (
              <MypageSelfGuardianPreviewSheet
                triggerLabel={t("guardianDashPublicProfileCta")}
                variant="outline"
                size="sm"
                triggerClassName="h-9"
              />
            ) : null}
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MypageBlockSeenBoundary blockKeys={["guardian.posts.pendingReview", "guardian.posts.drafts"]}>
                <div className="border-border/60 bg-muted/20 flex flex-col gap-2 rounded-xl border px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="text-[var(--brand-trust-blue)] size-5 opacity-90" strokeWidth={1.75} aria-hidden />
                    {uPosts > 0 && pendingPosts + draftPosts > 0 ? (
                      <BlockAttentionBadge count={uPosts} ariaLabel={t("attentionGuardianDashPosts")} />
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {t("guardianDashStatPostsPending")}
                  </p>
                  <p className="text-text-strong text-2xl font-semibold tabular-nums">{pendingPosts + draftPosts}</p>
                </div>
              </MypageBlockSeenBoundary>
              <MypageBlockSeenBoundary blockKey="guardian.matches.activeProgress">
                <div className="border-border/60 bg-muted/20 flex flex-col gap-2 rounded-xl border px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Heart className="text-[var(--brand-trust-blue)] size-5 opacity-90" strokeWidth={1.75} aria-hidden />
                    {(ub?.["guardian.matches.activeProgress"] ?? 0) > 0 && inProgressBookings > 0 ? (
                      <BlockAttentionBadge
                        count={ub?.["guardian.matches.activeProgress"] ?? 0}
                        ariaLabel={t("attentionGuardianDashMatching")}
                      />
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {t("guardianDashStatMatching")}
                  </p>
                  <p className="text-text-strong text-2xl font-semibold tabular-nums">{inProgressBookings}</p>
                </div>
              </MypageBlockSeenBoundary>
              <MypageBlockSeenBoundary blockKey="guardian.matches.reviewQueue">
                <div className="border-border/60 bg-muted/20 flex flex-col gap-2 rounded-xl border px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Shield className="text-[var(--brand-trust-blue)] size-5 opacity-90" strokeWidth={1.75} aria-hidden />
                    {(ub?.["guardian.matches.reviewQueue"] ?? 0) > 0 && reviewingBookings + openPool > 0 ? (
                      <BlockAttentionBadge
                        count={ub?.["guardian.matches.reviewQueue"] ?? 0}
                        ariaLabel={t("attentionGuardianDashReviewQueue")}
                      />
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {t("guardianDashStatReviewQueue")}
                  </p>
                  <p className="text-text-strong text-2xl font-semibold tabular-nums">{reviewingBookings}</p>
                </div>
              </MypageBlockSeenBoundary>
              <MypageBlockSeenBoundary blockKey="guardian.points.newEarnings">
                <div className="border-border/60 bg-muted/20 flex flex-col gap-2 rounded-xl border px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Wallet className="text-[var(--brand-trust-blue)] size-5 opacity-90" strokeWidth={1.75} aria-hidden />
                    {(ub?.["guardian.points.newEarnings"] ?? 0) > 0 && pointsRecent > 0 ? (
                      <BlockAttentionBadge
                        count={ub?.["guardian.points.newEarnings"] ?? 0}
                        ariaLabel={t("attentionGuardianDashPoints")}
                      />
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {t("guardianDashStatPoints")}
                  </p>
                  <p className="text-text-strong text-2xl font-semibold tabular-nums">{pointsLabel}</p>
                  <MypagePointsDetailSheetTrigger
                    triggerLabel={t("pointsSheetCta")}
                    variant="link"
                    size="sm"
                    className="h-auto justify-start px-0 text-xs font-semibold"
                  />
                </div>
              </MypageBlockSeenBoundary>
            </div>
            {openPool > 0 ? (
              <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
                {t("guardianDashOpenPoolNote", { count: openPool })}
              </p>
            ) : null}
            <p className="text-muted-foreground mt-4 text-xs leading-relaxed">{t("guardianDashApprovedStatsNote")}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("guardianDashMatchPipelineTitle")}</CardTitle>
            <p className="text-muted-foreground text-sm">{t("guardianDashMatchPipelineLead")}</p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <MypageBlockSeenBoundary blockKey="guardian.matches.reviewQueue">
              <div className="border-border/60 rounded-xl border bg-card/80 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-muted-foreground text-xs font-semibold uppercase">{t("guardianDashPipelineNew")}</p>
                  {(ub?.["guardian.matches.reviewQueue"] ?? 0) > 0 && reviewingBookings + openPool > 0 ? (
                    <BlockAttentionBadge
                      count={ub?.["guardian.matches.reviewQueue"] ?? 0}
                      ariaLabel={t("attentionGuardianDashReviewQueue")}
                    />
                  ) : null}
                </div>
                <p className="text-text-strong mt-2 text-2xl font-semibold tabular-nums">{reviewingBookings}</p>
                <Button asChild variant="link" className="mt-1 h-auto px-0 text-sm font-semibold">
                  <Link href={GUARDIAN_WORKSPACE.matches}>{t("guardianDashPipelineCta")}</Link>
                </Button>
              </div>
            </MypageBlockSeenBoundary>
            <div className="border-border/60 rounded-xl border bg-card/80 px-4 py-4">
              <p className="text-muted-foreground text-xs font-semibold uppercase">{t("guardianDashPipelineActive")}</p>
              <p className="text-text-strong mt-2 text-2xl font-semibold tabular-nums">{inProgressBookings}</p>
              <Button asChild variant="link" className="mt-1 h-auto px-0 text-sm font-semibold">
                <Link href={GUARDIAN_WORKSPACE.matches}>{t("guardianDashPipelineCta")}</Link>
              </Button>
            </div>
            <div className="border-border/60 rounded-xl border bg-card/80 px-4 py-4">
              <p className="text-muted-foreground text-xs font-semibold uppercase">{t("guardianDashPipelineDone")}</p>
              <p className="text-text-strong mt-2 text-2xl font-semibold tabular-nums">{completedBookings}</p>
              <Button asChild variant="link" className="mt-1 h-auto px-0 text-sm font-semibold">
                <Link href={GUARDIAN_WORKSPACE.matches}>{t("guardianDashPipelineCta")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("guardianDashQuickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="default" className="h-12 justify-start gap-2 rounded-[var(--radius-md)] font-semibold">
              <Link href={GUARDIAN_WORKSPACE.postsNew}>
                <FileText className="size-4" aria-hidden />
                {t("guardianDashActionNewPost")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 justify-start gap-2 rounded-[var(--radius-md)] font-semibold">
              <Link href={GUARDIAN_WORKSPACE.matches}>
                <Heart className="size-4" aria-hidden />
                {t("guardianDashActionMatches")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 justify-start gap-2 rounded-[var(--radius-md)] font-semibold">
              <Link href={GUARDIAN_WORKSPACE.points}>
                <Wallet className="size-4" aria-hidden />
                {t("guardianDashActionPoints")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 justify-start gap-2 rounded-[var(--radius-md)] font-semibold">
              <Link href={GUARDIAN_WORKSPACE.profileEdit}>
                <Pencil className="size-4" aria-hidden />
                {t("guardianDashActionEditProfile")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 justify-start gap-2 rounded-[var(--radius-md)] font-semibold sm:col-span-2">
              <Link href={GUARDIAN_WORKSPACE.settings}>
                <Shield className="size-4" aria-hidden />
                {t("guardianNavSettings")}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 border-dashed bg-muted/15 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-base font-medium">{t("guardianDashRecentTitle")}</CardTitle>
            <p className="text-muted-foreground text-sm font-normal">{t("guardianDashRecentLead")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPosts.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("guardianDashRecentEmpty")}</p>
            ) : (
              <ul className="space-y-2">
                {recentPosts.map((p) => (
                  <li
                    key={p.id}
                    className="border-border/50 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/60 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="rounded-full text-[10px] font-semibold capitalize">
                          {p.status}
                        </Badge>
                        <span className="text-muted-foreground text-xs">{formatPostUpdated(p.updatedAt, locale)}</span>
                      </div>
                      <p className="text-foreground mt-1 truncate text-sm font-medium">{p.title || t("guardianDashRecentUntitled")}</p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="shrink-0 rounded-lg text-xs font-semibold">
                      <Link href={GUARDIAN_WORKSPACE.postEdit(p.id)}>{t("guardianDashRecentEdit")}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="link" className="h-auto px-0 text-sm font-semibold">
              <Link href={GUARDIAN_WORKSPACE.posts}>{t("guardianDashRecentViewAll")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <Card className="rounded-2xl border-destructive/25 shadow-[var(--shadow-sm)]">
        <CardHeader className="pb-2">
          <Badge variant="destructive" className="mb-2 w-fit">
            {t("guardianStatus.rejected")}
          </Badge>
          <CardTitle className="text-xl">{t("guardianDashRejectedTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-[15px] leading-relaxed">{t("guardianDashRejectedLead")}</p>
          <div className="border-destructive/20 bg-destructive/5 rounded-xl border px-4 py-3 text-sm">
            <p className="text-muted-foreground text-xs font-semibold uppercase">{t("guardianDashRejectedReasonLabel")}</p>
            <p className="text-foreground mt-1">{t("guardianDashRejectedReasonPlaceholder")}</p>
          </div>
          {primaryCta("/guardian/profile", t("guardianCtaRejected"))}
        </CardContent>
      </Card>
    );
  }

  /* suspended */
  return (
    <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
      <CardHeader className="pb-2">
        <Badge variant="outline" className="mb-2 w-fit">
          {t("guardianStatus.suspended")}
        </Badge>
        <CardTitle className="text-xl">{t("guardianDashSuspendedTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-[15px] leading-relaxed">{t("guardianDashSuspendedLead")}</p>
        {primaryCta("/guardian/profile", t("guardianCtaSuspended"))}
        <p className="text-muted-foreground text-xs leading-relaxed">{t("guardianCtaSuspendedHint")}</p>
      </CardContent>
    </Card>
  );
}
