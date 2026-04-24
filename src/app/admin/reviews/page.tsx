import {
  mockGuardianReviews,
  mockGuardians,
  mockTravelerReviews,
} from "@/data/mock";
import {
  AdminReviewsPanel,
  type GuardianReviewRow,
  type TravelerReviewRow,
} from "@/components/admin/admin-reviews-panel";
import { AdminOpsPillarHeader } from "@/components/admin/admin-ops-pillar";

export const metadata = {
  title: "Reviews | Admin",
};

function guardianName(id: string) {
  return mockGuardians.find((g) => g.user_id === id)?.display_name ?? id;
}

function travelerName(id: string) {
  const map: Record<string, string> = {
    t7: "Traveler (t7)",
    t8: "Traveler (t8)",
    t9: "Traveler (t9)",
  };
  return map[id] ?? `Traveler ${id}`;
}

export default function AdminReviewsPage() {
  const travelerRows: TravelerReviewRow[] = mockTravelerReviews.map((r) => ({
    ...r,
    traveler_label: travelerName(r.traveler_user_id),
    guardian_label: guardianName(r.guardian_user_id),
  }));

  const guardianRows: GuardianReviewRow[] = mockGuardianReviews.map((r) => ({
    ...r,
    traveler_label: travelerName(r.traveler_user_id),
    guardian_label: guardianName(r.guardian_user_id),
  }));

  return (
    <div className="space-y-10">
      <div>
        <AdminOpsPillarHeader
          pillar="trust"
          title="Mutual reviews (trust signals)"
          description="Supports guardian program quality — not a substitute for booking ops or content moderation. Used cautiously in matching and incident review."
        />
        <h1 className="text-foreground mt-4 text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          {/* TODO(prod): Rating calculations, appeals, visibility rules, privacy for guardian→traveler notes. */}
          Two-way trust layer — admin-gated usage; not public shaming.
        </p>
      </div>

      <AdminReviewsPanel travelerRows={travelerRows} guardianRows={guardianRows} />
    </div>
  );
}
