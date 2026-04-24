import type {
  GuardianProfilePointsStatus,
  PointLedgerEventType,
  PointLedgerStatus,
  PostRewardTiming,
  ProfileRewardTiming,
} from "@/lib/points/constants";

export type PointPolicyVersionRow = {
  id: string;
  version_code: string;
  profile_signup_reward: number;
  profile_reward_timing: ProfileRewardTiming;
  post_publish_reward: number;
  post_reward_timing: PostRewardTiming;
  post_daily_limit: number;
  post_monthly_limit: number;
  match_complete_reward: number;
  match_reward_timing: "confirmed_only";
  allow_revoke_on_post_delete: boolean;
  allow_revoke_on_policy_violation: boolean;
  is_active: boolean;
  effective_from: string;
  created_at: string;
  created_by_user_id: string | null;
};

export type PointLedgerRow = {
  id: string;
  user_id: string;
  event_type: PointLedgerEventType;
  event_ref_type: string | null;
  event_ref_id: string | null;
  amount: number;
  status: PointLedgerStatus;
  reason: string | null;
  policy_version: string;
  idempotency_key: string;
  occurred_at: string;
  available_at: string | null;
  revoked_at: string | null;
};

export type PointBalanceSnapshotRow = {
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_revoked: number;
  updated_at: string;
};

export type MatchRow = {
  id: string;
  booking_id: string | null;
  traveler_user_id: string;
  guardian_user_id: string;
  traveler_confirmed_at: string | null;
  guardian_confirmed_at: string | null;
  completion_confirmed_at: string | null;
  reward_granted_at: string | null;
  reward_revoked_at: string | null;
  created_at: string;
};

export type ApplyLedgerResult = { inserted: boolean; ledgerId: string | null };

export type GuardianProfilePointsFields = {
  user_id: string;
  approval_status: string;
  profile_points_status: GuardianProfilePointsStatus;
  reward_granted_at: string | null;
  reward_revoked_at: string | null;
};

/** `/api/traveler/points` 및 마이페이지 시트와 동일한 직렬화 형태 */
export type MypagePointsApiResponse = {
  balance: {
    user_id: string;
    balance: number;
    lifetime_earned: number;
    lifetime_revoked: number;
    updated_at: string | null;
  };
  ledger: PointLedgerRow[];
  policy: PointPolicyVersionRow | null;
};
