/** Point policy timing — DB check constraint mirrors these values. */
export const PROFILE_REWARD_TIMING = ["immediate", "approval"] as const;
export type ProfileRewardTiming = (typeof PROFILE_REWARD_TIMING)[number];

export const POST_REWARD_TIMING = ["immediate", "approval"] as const;
export type PostRewardTiming = (typeof POST_REWARD_TIMING)[number];

/** Spec: only confirmed_only for match rewards. */
export const MATCH_REWARD_TIMING = ["confirmed_only"] as const;
export type MatchRewardTiming = (typeof MATCH_REWARD_TIMING)[number];

export const POINT_LEDGER_EVENT_TYPES = [
  "guardian_profile_reward",
  "post_publish_reward",
  "post_reward_revoke",
  "match_complete_reward",
  "manual_adjustment",
] as const;
export type PointLedgerEventType = (typeof POINT_LEDGER_EVENT_TYPES)[number];

export const POINT_LEDGER_STATUSES = ["pending", "available", "revoked"] as const;
export type PointLedgerStatus = (typeof POINT_LEDGER_STATUSES)[number];

export const GUARDIAN_PROFILE_POINTS_STATUS = ["none", "granted", "revoked"] as const;
export type GuardianProfilePointsStatus = (typeof GUARDIAN_PROFILE_POINTS_STATUS)[number];

/** Idempotency key builders (spec + per-user match leg). */
export function idempotencyGuardianProfileReward(guardianProfileUserId: string) {
  return `guardian-profile-reward:${guardianProfileUserId}`;
}

export function idempotencyPostReward(postId: string) {
  return `post-reward:${postId}`;
}

export function idempotencyPostRewardRevoke(postId: string) {
  return `post-reward-revoke:${postId}`;
}

export function idempotencyMatchReward(matchId: string, userId: string) {
  return `match-reward:${matchId}:${userId}`;
}
