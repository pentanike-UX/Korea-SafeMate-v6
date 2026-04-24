import Link from "next/link";
import type {
  BookingWithDetails,
  ContactMethod,
  GuardianActivityLog,
  GuardianProfile,
  GuardianReview,
  TravelerReview,
} from "@/types/domain";
import type { GuardianDashboardSnapshot } from "@/types/guardian-dashboard";
import { GuardianAvailabilityContactModule } from "@/components/guardian/dashboard/guardian-availability-contact-module";
import { GuardianBookingsModule } from "@/components/guardian/dashboard/guardian-bookings-module";
import { GuardianContributionSection } from "@/components/guardian/dashboard/guardian-contribution-section";
import { GuardianDashboardLane } from "@/components/guardian/dashboard/guardian-dashboard-lane";
import { GuardianFeaturedReputationSection } from "@/components/guardian/dashboard/guardian-featured-reputation-section";
import { GuardianProfileSummaryCard } from "@/components/guardian/dashboard/guardian-profile-summary-card";
import { GuardianReviewsTrustModule } from "@/components/guardian/dashboard/guardian-reviews-trust-module";
import { GuardianTierStatusSection } from "@/components/guardian/dashboard/guardian-tier-status-section";
import { Button } from "@/components/ui/button";

export function GuardianDashboardView({
  profile,
  snapshot,
  activityLogs,
  assignedBookings,
  openPoolBookings,
  contacts,
  travelerReviews,
  guardianReviews,
}: {
  profile: GuardianProfile;
  snapshot: GuardianDashboardSnapshot;
  activityLogs: GuardianActivityLog[];
  assignedBookings: BookingWithDetails[];
  openPoolBookings: BookingWithDetails[];
  contacts: ContactMethod[];
  travelerReviews: TravelerReview[];
  guardianReviews: GuardianReview[];
}) {
  const exploreHref = `/explore/${profile.primary_region_slug}`;

  return (
    <div className="space-y-10 pb-12">
      <header className="space-y-3">
        <p className="text-primary text-xs font-semibold tracking-widest uppercase drop-shadow-[0_0_12px_color-mix(in_srgb,var(--brand-primary)_25%,transparent)]">
          Guardian workspace
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-text-strong text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
              {/* TODO(prod): Supabase auth role check — only contributor / guardian roles; hydrate from session. */}
              Your view is grouped the same way operations runs the platform:{" "}
              <span className="text-foreground font-medium">content</span>,{" "}
              <span className="text-foreground font-medium">trust &amp; program</span>, and{" "}
              <span className="text-foreground font-medium">bookings &amp; handoff</span> — three separate admin
              systems.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl">
              <Link href={exploreHref}>Explore · contribute</Link>
            </Button>
          </div>
        </div>
      </header>

      <GuardianProfileSummaryCard profile={profile} />

      <div className="space-y-8">
        <GuardianDashboardLane
          system="content"
          title="Content & editorial pipeline"
          description="Moderation, approvals, and publishing cadence. Admins own quality here — distinct from matching tickets or tier verification."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <GuardianContributionSection
              snapshot={snapshot}
              activityLogs={activityLogs}
              exploreHref={exploreHref}
              postsApprovedLast7d={profile.posts_approved_last_7d}
            />
            <GuardianFeaturedReputationSection profile={profile} snapshot={snapshot} />
          </div>
        </GuardianDashboardLane>

        <GuardianDashboardLane
          system="trust"
          title="Trust, tier & program status"
          description="Verification, mutual reviews, and matching eligibility flags. Admins control gates — contribution volume alone does not unlock trusted matching."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <GuardianTierStatusSection profile={profile} snapshot={snapshot} />
            <GuardianReviewsTrustModule
              avgTravelerRating={profile.avg_traveler_rating}
              travelerReviews={travelerReviews}
              guardianReviews={guardianReviews}
              trustHealth={snapshot.trust_health}
              trustNote={snapshot.trust_health_note}
              openIncidents={snapshot.open_incidents_for_guardian}
            />
          </div>
        </GuardianDashboardLane>

        <GuardianDashboardLane
          system="bookings"
          title="Bookings & handoff readiness"
          description="Assignments, sessions, and external contact preferences for coordinated support. Admins run matching and lifecycle separately from editorial and tier decisions."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <GuardianBookingsModule
              guardianUserId={profile.user_id}
              assigned={assignedBookings}
              openPool={openPoolBookings}
              matchingEnabled={profile.matching_enabled}
            />
            <GuardianAvailabilityContactModule profile={profile} snapshot={snapshot} contacts={contacts} />
          </div>
        </GuardianDashboardLane>
      </div>
    </div>
  );
}
