/* TODO(i18n): Admin remains English-first; localize via dedicated namespaces when needed. */
import Link from "next/link";
import {
  mockBookings,
  mockContentPosts,
  mockGuardians,
  mockTravelerReviews,
  mockGuardianReviews,
} from "@/data/mock";
import { AdminOpsPillarHeader } from "@/components/admin/admin-ops-pillar";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Dashboard | Admin · 하루",
};

export default function AdminOverviewPage() {
  const issues = mockBookings.filter((b) => b.status === "issue_reported").length;
  const pendingGuardians = mockGuardians.filter(
    (g) => g.approval_status === "pending" || g.approval_status === "under_review",
  ).length;
  const pendingContent = mockContentPosts.filter((p) => p.status === "pending").length;
  const reviewCount = mockTravelerReviews.length + mockGuardianReviews.length;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            Operations command center
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
            {/* TODO(prod): Supabase admin role, live metrics, audit log. */}
            Three parallel workstreams — bookings, guardian program trust, and content moderation — share brand
            context but should not blur operationally.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-9 shrink-0 rounded-lg">
          <Link href="/">View public site</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/80 border-l-sky-600/80 overflow-hidden border-l-4 shadow-none">
          <CardContent className="p-5">
            <AdminOpsPillarHeader
              pillar="bookings"
              title="Booking operations"
              description="Requests, assignment, status, incidents, and external handoff coordination."
              className="mb-4"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminStatCard label="Active rows" value={mockBookings.length} hint="Mock pipeline" />
              <AdminStatCard label="Open issues" value={issues} hint="Needs triage" />
            </div>
            <Button asChild className="mt-4 h-9 w-full rounded-lg" variant="secondary">
              <Link href="/admin/matches">Open matches</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/80 border-l-violet-600/80 overflow-hidden border-l-4 shadow-none">
          <CardContent className="p-5">
            <AdminOpsPillarHeader
              pillar="trust"
              title="Guardian trust & program"
              description="Tiers, verification, matching gates, and mutual review signals for matching quality."
              className="mb-4"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminStatCard label="Pipeline" value={pendingGuardians} hint="Pending / under review" />
              <AdminStatCard label="Mutual reviews" value={reviewCount} hint="Sample dataset" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild variant="secondary" className="h-9 rounded-lg">
                <Link href="/admin/guardians">Guardians</Link>
              </Button>
              <Button asChild variant="outline" className="h-9 rounded-lg">
                <Link href="/admin/reviews">Reviews</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 border-l-emerald-600/80 overflow-hidden border-l-4 shadow-none">
          <CardContent className="p-5">
            <AdminOpsPillarHeader
              pillar="content"
              title="Content quality"
              description="Editorial queue and moderation — feeds Explore and guardian contribution metrics."
              className="mb-4"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminStatCard label="Pending moderation" value={pendingContent} hint="Awaiting decision" />
              <AdminStatCard label="Total posts (mock)" value={mockContentPosts.length} hint="All statuses" />
            </div>
            <Button asChild className="mt-4 h-9 w-full rounded-lg" variant="secondary">
              <Link href="/admin/posts">Open posts queue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
