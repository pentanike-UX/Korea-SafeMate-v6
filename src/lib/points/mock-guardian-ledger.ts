import { getGuardianSeedBundle } from "@/data/mock/guardian-seed-bundle";
import { mockBookings } from "@/data/mock/bookings";
import { mockTravelerReviews } from "@/data/mock/traveler-reviews";
import type { PointPolicyVersionRow } from "@/lib/points/types";

type MockLedgerRow = {
  id: string;
  amount: number;
  event_type: "guardian_profile_reward" | "post_publish_reward" | "match_complete_reward" | "manual_adjustment";
  reason: string;
  policy_version: string;
  occurred_at: string;
};

function daysAgoIso(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

/**
 * Mock guardian points should look like real operations history while
 * still reconciling to the current seed balance.
 */
export function buildMockGuardianLedger(userId: string, policy: PointPolicyVersionRow | null): MockLedgerRow[] {
  const bundle = getGuardianSeedBundle();
  const target = bundle.pointsByAuthorId[userId] ?? 0;
  const guardian = bundle.guardians.find((g) => g.user_id === userId);
  const approvedPosts = bundle.posts.filter((p) => p.author_user_id === userId && p.status === "approved").length;
  const completedMatches = mockBookings.filter((b) => b.guardian_user_id === userId && b.status === "completed").length;
  const reviewCount = mockTravelerReviews.filter((r) => r.guardian_user_id === userId).length;

  const profileReward = policy?.profile_signup_reward ?? 300;
  const postReward = policy?.post_publish_reward ?? 150;
  const matchReward = policy?.match_complete_reward ?? 200;
  const version = policy?.version_code ?? "mock-v1";

  const rows: MockLedgerRow[] = [];
  let sum = 0;

  rows.push({
    id: `${userId}-profile`,
    amount: profileReward,
    event_type: "guardian_profile_reward",
    reason: "프로필 등록 보너스",
    policy_version: version,
    occurred_at: daysAgoIso(60),
  });
  sum += profileReward;

  if (guardian?.avatar_image_url || guardian?.list_card_image_url || guardian?.detail_hero_image_url) {
    rows.push({
      id: `${userId}-images`,
      amount: 80,
      event_type: "manual_adjustment",
      reason: "소개 이미지 3종 등록 보너스",
      policy_version: version,
      occurred_at: daysAgoIso(45),
    });
    sum += 80;
  }

  for (let i = 0; i < approvedPosts; i += 1) {
    rows.push({
      id: `${userId}-post-${i + 1}`,
      amount: postReward,
      event_type: "post_publish_reward",
      reason: `포스트 게시 적립 #${i + 1}`,
      policy_version: version,
      occurred_at: daysAgoIso(36 - i * 3),
    });
    sum += postReward;
  }

  for (let i = 0; i < completedMatches; i += 1) {
    rows.push({
      id: `${userId}-match-${i + 1}`,
      amount: matchReward,
      event_type: "match_complete_reward",
      reason: `매칭 완료 적립 #${i + 1}`,
      policy_version: version,
      occurred_at: daysAgoIso(14 - i * 2),
    });
    sum += matchReward;
  }

  if (reviewCount > 0) {
    const reviewBonus = reviewCount * 20;
    rows.push({
      id: `${userId}-review-bonus`,
      amount: reviewBonus,
      event_type: "manual_adjustment",
      reason: `리뷰 도착 보너스 (${reviewCount}건)`,
      policy_version: version,
      occurred_at: daysAgoIso(7),
    });
    sum += reviewBonus;
  }

  // Reconcile generated history with current seed balance.
  const delta = target - sum;
  if (delta !== 0) {
    rows.push({
      id: `${userId}-reconcile`,
      amount: delta,
      event_type: "manual_adjustment",
      reason: delta > 0 ? "등급/기여 누적 운영 보정" : "정책 조정 차감 반영",
      policy_version: version,
      occurred_at: daysAgoIso(2),
    });
    sum += delta;
  }

  return rows.sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
}
