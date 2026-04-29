/* TODO(i18n): Keep English-first for now; add locale routing or cookie-based messages when localizing Guardian dashboard. */
import {
  getGuardianDashboardSnapshot,
  mockBookings,
  mockContactMethods,
  mockGuardianActivityLogs,
  mockGuardianReviews,
  mockGuardians,
  mockTravelerReviews,
} from "@/data/mock";
import { GuardianDashboardView } from "@/components/guardian/dashboard/guardian-dashboard-view";

export const metadata = {
  title: "Guardian dashboard | 하루",
};

const DEFAULT_PREVIEW_ID = "mg14";

type Props = {
  searchParams?: Promise<{ as?: string }>;
};

export default async function GuardianDashboardPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const pick =
    sp.as && mockGuardians.some((g) => g.user_id === sp.as) ? sp.as : DEFAULT_PREVIEW_ID;

  const profile = mockGuardians.find((g) => g.user_id === pick)!;
  const snapshot = getGuardianDashboardSnapshot(profile);
  const assigned = mockBookings.filter((b) => b.guardian_user_id === pick);
  const openPool = mockBookings.filter((b) => b.guardian_user_id === null && b.status === "reviewing");
  const contacts = mockContactMethods.filter((c) => c.user_id === pick);
  const logs = mockGuardianActivityLogs.filter((l) => l.guardian_user_id === pick);
  const travelerReviews = mockTravelerReviews.filter((r) => r.guardian_user_id === pick);
  const guardianReviews = mockGuardianReviews.filter((r) => r.guardian_user_id === pick);

  return (
    <>
      {sp.as ? (
        <p className="text-muted-foreground mb-6 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs leading-relaxed">
          Preview mode: <span className="text-foreground font-mono">{pick}</span> —{" "}
          {/* TODO(prod): Remove query override; use authenticated guardian only. */}
          <code className="text-foreground">?as=</code> is for internal mock demos only.
        </p>
      ) : null}
      <GuardianDashboardView
        profile={profile}
        snapshot={snapshot}
        activityLogs={logs}
        assignedBookings={assigned}
        openPoolBookings={openPool}
        contacts={contacts}
        travelerReviews={travelerReviews}
        guardianReviews={guardianReviews}
      />
    </>
  );
}
