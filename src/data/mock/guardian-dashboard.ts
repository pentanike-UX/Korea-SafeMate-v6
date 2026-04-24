import type { GuardianProfile } from "@/types/domain";
import type { GuardianDashboardSnapshot } from "@/types/guardian-dashboard";

function defaultSnapshot(profile: GuardianProfile): GuardianDashboardSnapshot {
  return {
    guardian_user_id: profile.user_id,
    posts_submitted_this_month: profile.posts_approved_last_30d + 2,
    posts_approved_this_month: profile.posts_approved_last_30d,
    posts_pending_review: 1,
    contribution_streak_weeks: 0,
    weekly_approved_target: 3,
    monthly_approved_target: 12,
    category_counts: [],
    availability_slots: [],
    secondary_region_slugs: [],
    supported_service_codes: ["arrival", "k_route", "first_24h"],
    trust_health: "good",
    trust_health_note: "시드 데이터 기준 요약입니다. 운영 연동 후 실시간 지표로 대체됩니다.",
    open_incidents_for_guardian: 0,
    featured_spotlight: {
      eligible: profile.featured,
      headline: "Featured spotlight",
      body: "승인·품질 신호에 따라 에디토리얼 노출이 결정됩니다.",
    },
    quality_indicators: [],
  };
}

export function getGuardianDashboardSnapshot(profile: GuardianProfile): GuardianDashboardSnapshot {
  return defaultSnapshot(profile);
}
