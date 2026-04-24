import { MypageMatchesView } from "@/components/mypage/mypage-matches-view";
import { resolveMypageSessionRole } from "@/lib/mypage-account.server";
import { getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { getMatchRequestsForTraveler } from "@/lib/traveler-match-requests.server";
import { getSubmittedTravelerReviewsFromCookie } from "@/lib/traveler-submitted-reviews.server";

export default async function MypageMatchesPage() {
  const { appRole } = await resolveMypageSessionRole();
  const travelerId = await getSupabaseAuthUserIdOnly();
  const hasTravelerSession = !!travelerId;
  const items = travelerId ? await getMatchRequestsForTraveler(travelerId) : [];
  const submitted = await getSubmittedTravelerReviewsFromCookie();
  const reviewedMatchIds = new Set<string>();
  for (const s of submitted) {
    if (s.booking_id) reviewedMatchIds.add(s.booking_id);
    if (s.id) reviewedMatchIds.add(s.id);
  }
  return (
    <MypageMatchesView
      appRole={appRole}
      items={items}
      hasTravelerSession={hasTravelerSession}
      reviewedMatchIds={Array.from(reviewedMatchIds)}
    />
  );
}
