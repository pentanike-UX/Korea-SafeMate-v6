import { cache } from "react";
import {
  idempotencyGuardianProfileReward,
  idempotencyMatchReward,
  idempotencyPostReward,
  idempotencyPostRewardRevoke,
  type PointLedgerEventType,
} from "@/lib/points/constants";
import { getActivePointPolicy } from "@/lib/points/point-policy-repository";
import type { ApplyLedgerResult } from "@/lib/points/types";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

/** Supabase가 count+head에서 null을 반환할 때 warn은 프로세스당 1회만(스팸 방지). */
let ledgerAttentionCountNullWarned = false;

async function rpcApplyLedger(params: {
  userId: string;
  amount: number;
  eventType: PointLedgerEventType;
  eventRefType: string | null;
  eventRefId: string | null;
  reason: string | null;
  policyVersion: string;
  idempotencyKey: string;
}): Promise<ApplyLedgerResult> {
  const sb = createServiceRoleSupabase();
  if (!sb) return { inserted: false, ledgerId: null };

  const nowIso = new Date().toISOString();
  const { data, error } = await sb.rpc("points_apply_ledger", {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_event_type: params.eventType,
    p_event_ref_type: params.eventRefType,
    p_event_ref_id: params.eventRefId,
    p_status: "available",
    p_reason: params.reason,
    p_policy_version: params.policyVersion,
    p_idempotency_key: params.idempotencyKey,
    p_available_at: null,
    p_occurred_at: nowIso,
  });

  if (error) {
    console.error("[points] points_apply_ledger", error);
    return { inserted: false, ledgerId: null };
  }

  const row = data as { inserted?: boolean; ledger_id?: string | null } | Record<string, unknown> | null;
  const inserted = Boolean(row && typeof row === "object" && "inserted" in row && row.inserted);
  const ledgerId =
    row && typeof row === "object" && "ledger_id" in row && typeof row.ledger_id === "string"
      ? row.ledger_id
      : null;
  return { inserted, ledgerId };
}

async function sumPostRewardsInRange(authorUserId: string, start: Date, end: Date): Promise<number> {
  const sb = createServiceRoleSupabase();
  if (!sb) return 0;

  const { data, error } = await sb
    .from("point_ledger")
    .select("amount")
    .eq("user_id", authorUserId)
    .eq("event_type", "post_publish_reward")
    .gte("occurred_at", start.toISOString())
    .lt("occurred_at", end.toISOString());

  if (error || !data) return 0;
  return data.reduce((s, r) => s + (r.amount > 0 ? r.amount : 0), 0);
}

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfUtcMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addOneDay(d: Date) {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + 1);
  return n;
}

function addOneMonth(d: Date) {
  const n = new Date(d);
  n.setUTCMonth(n.getUTCMonth() + 1);
  return n;
}

/** Guardian profile reward — idempotent per profile user id. */
export async function tryGrantGuardianProfileReward(guardianUserId: string): Promise<ApplyLedgerResult> {
  const policy = await getActivePointPolicy();
  const sb = createServiceRoleSupabase();
  if (!policy || !sb) return { inserted: false, ledgerId: null };

  const { data: profile, error } = await sb
    .from("guardian_profiles")
    .select("user_id, approval_status, profile_points_status, reward_granted_at, reward_revoked_at")
    .eq("user_id", guardianUserId)
    .maybeSingle();

  if (error || !profile) return { inserted: false, ledgerId: null };
  if (profile.reward_granted_at || profile.profile_points_status === "revoked") {
    return { inserted: false, ledgerId: null };
  }

  const timing = policy.profile_reward_timing;
  const st = profile.approval_status as string;
  if (st === "rejected") return { inserted: false, ledgerId: null };
  if (timing === "approval" && st !== "approved") return { inserted: false, ledgerId: null };
  if (timing === "immediate" && !(st === "pending" || st === "under_review" || st === "approved")) {
    return { inserted: false, ledgerId: null };
  }

  const amount = policy.profile_signup_reward;
  const res = await rpcApplyLedger({
    userId: guardianUserId,
    amount,
    eventType: "guardian_profile_reward",
    eventRefType: "guardian_profile",
    eventRefId: guardianUserId,
    reason: "Guardian profile reward",
    policyVersion: policy.version_code,
    idempotencyKey: idempotencyGuardianProfileReward(guardianUserId),
  });

  if (res.inserted) {
    await sb
      .from("guardian_profiles")
      .update({
        profile_points_status: "granted",
        reward_granted_at: new Date().toISOString(),
      })
      .eq("user_id", guardianUserId);
  }

  return res;
}

export type ContentPostRewardContext = {
  id: string;
  author_user_id: string;
  status: string;
  reviewed_by_user_id: string | null;
  moderation_reward_ok: boolean | null;
  reward_granted_at: string | null;
  reward_revoked_at: string | null;
};

/** Post publish reward — checks policy timing, limits, idempotency. */
export async function tryGrantPostReward(post: ContentPostRewardContext): Promise<ApplyLedgerResult> {
  const policy = await getActivePointPolicy();
  const sb = createServiceRoleSupabase();
  if (!policy || !sb) return { inserted: false, ledgerId: null };

  if (post.status !== "approved") return { inserted: false, ledgerId: null };
  if (post.reward_granted_at) return { inserted: false, ledgerId: null };

  if (policy.post_reward_timing === "approval" && !post.moderation_reward_ok) {
    return { inserted: false, ledgerId: null };
  }

  const now = new Date();
  const dayStart = startOfUtcDay(now);
  const dayEnd = addOneDay(dayStart);
  const monthStart = startOfUtcMonth(now);
  const monthEnd = addOneMonth(monthStart);

  const daySum = await sumPostRewardsInRange(post.author_user_id, dayStart, dayEnd);
  const monthSum = await sumPostRewardsInRange(post.author_user_id, monthStart, monthEnd);

  const reward = policy.post_publish_reward;
  if (daySum + reward > policy.post_daily_limit) return { inserted: false, ledgerId: null };
  if (monthSum + reward > policy.post_monthly_limit) return { inserted: false, ledgerId: null };

  const res = await rpcApplyLedger({
    userId: post.author_user_id,
    amount: reward,
    eventType: "post_publish_reward",
    eventRefType: "content_post",
    eventRefId: post.id,
    reason: "Post publish reward",
    policyVersion: policy.version_code,
    idempotencyKey: idempotencyPostReward(post.id),
  });

  if (res.inserted) {
    await sb.from("content_posts").update({ reward_granted_at: new Date().toISOString() }).eq("id", post.id);
  }

  return res;
}

/** Release post reward when moderation_reward_ok becomes true (approval timing). */
export async function tryGrantPostRewardAfterModeration(postId: string): Promise<ApplyLedgerResult> {
  const sb = createServiceRoleSupabase();
  if (!sb) return { inserted: false, ledgerId: null };

  const { data: row, error } = await sb
    .from("content_posts")
    .select("id, author_user_id, status, reviewed_by_user_id, moderation_reward_ok, reward_granted_at, reward_revoked_at")
    .eq("id", postId)
    .maybeSingle();

  if (error || !row) return { inserted: false, ledgerId: null };
  return tryGrantPostReward({
    id: row.id,
    author_user_id: row.author_user_id,
    status: row.status,
    reviewed_by_user_id: row.reviewed_by_user_id,
    moderation_reward_ok: row.moderation_reward_ok ?? false,
    reward_granted_at: row.reward_granted_at,
    reward_revoked_at: row.reward_revoked_at,
  });
}

function shouldRevokePost(policy: Awaited<ReturnType<typeof getActivePointPolicy>>, reason: "delete" | "hidden" | "policy") {
  if (!policy) return false;
  if (reason === "delete" && policy.allow_revoke_on_post_delete) return true;
  if (reason === "policy" && policy.allow_revoke_on_policy_violation) return true;
  if (reason === "hidden" && policy.allow_revoke_on_post_delete) return true;
  return false;
}

export async function tryRevokePostReward(
  postId: string,
  authorUserId: string,
  revokeReason: "delete" | "hidden" | "policy",
): Promise<ApplyLedgerResult> {
  const policy = await getActivePointPolicy();
  const sb = createServiceRoleSupabase();
  if (!policy || !sb) return { inserted: false, ledgerId: null };
  if (!shouldRevokePost(policy, revokeReason)) return { inserted: false, ledgerId: null };

  const { data: post } = await sb
    .from("content_posts")
    .select("reward_granted_at, reward_revoked_at")
    .eq("id", postId)
    .maybeSingle();

  if (!post?.reward_granted_at || post.reward_revoked_at) return { inserted: false, ledgerId: null };

  const { data: grantRow } = await sb
    .from("point_ledger")
    .select("amount")
    .eq("idempotency_key", idempotencyPostReward(postId))
    .maybeSingle();

  const original = grantRow?.amount ?? policy.post_publish_reward;
  const clawback = -Math.abs(original);

  const res = await rpcApplyLedger({
    userId: authorUserId,
    amount: clawback,
    eventType: "post_reward_revoke",
    eventRefType: "content_post",
    eventRefId: postId,
    reason:
      revokeReason === "delete"
        ? "Post deleted — reward revoked"
        : revokeReason === "hidden"
          ? "Post hidden — reward revoked"
          : "Policy violation — reward revoked",
    policyVersion: policy.version_code,
    idempotencyKey: idempotencyPostRewardRevoke(postId),
  });

  if (res.inserted) {
    await sb.from("content_posts").update({ reward_revoked_at: new Date().toISOString() }).eq("id", postId);
  }

  return res;
}

/** Both sides confirmed → completion_confirmed_at + rewards for traveler & guardian. */
export async function tryGrantMatchRewards(matchId: string): Promise<{ traveler: ApplyLedgerResult; guardian: ApplyLedgerResult }> {
  const policy = await getActivePointPolicy();
  const sb = createServiceRoleSupabase();
  const empty = { inserted: false, ledgerId: null as string | null };
  if (!policy || !sb) return { traveler: empty, guardian: empty };

  const { data: m, error } = await sb
    .from("matches")
    .select(
      "id, traveler_user_id, guardian_user_id, traveler_confirmed_at, guardian_confirmed_at, completion_confirmed_at, reward_granted_at",
    )
    .eq("id", matchId)
    .maybeSingle();

  if (error || !m || !m.traveler_confirmed_at || !m.guardian_confirmed_at) {
    return { traveler: empty, guardian: empty };
  }
  if (m.reward_granted_at) return { traveler: empty, guardian: empty };

  const nowIso = new Date().toISOString();
  await sb.from("matches").update({ completion_confirmed_at: nowIso }).eq("id", matchId).is("completion_confirmed_at", null);

  const reward = policy.match_complete_reward;
  const tKey = idempotencyMatchReward(matchId, m.traveler_user_id);
  const gKey = idempotencyMatchReward(matchId, m.guardian_user_id);

  const travelerRes = await rpcApplyLedger({
    userId: m.traveler_user_id,
    amount: reward,
    eventType: "match_complete_reward",
    eventRefType: "match",
    eventRefId: matchId,
    reason: "Match completed (traveler)",
    policyVersion: policy.version_code,
    idempotencyKey: tKey,
  });

  const guardianRes = await rpcApplyLedger({
    userId: m.guardian_user_id,
    amount: reward,
    eventType: "match_complete_reward",
    eventRefType: "match",
    eventRefId: matchId,
    reason: "Match completed (guardian)",
    policyVersion: policy.version_code,
    idempotencyKey: gKey,
  });

  const [{ data: tRow }, { data: gRow }] = await Promise.all([
    sb.from("point_ledger").select("id").eq("idempotency_key", tKey).maybeSingle(),
    sb.from("point_ledger").select("id").eq("idempotency_key", gKey).maybeSingle(),
  ]);

  if (tRow && gRow) {
    await sb.from("matches").update({ reward_granted_at: nowIso }).eq("id", matchId).is("reward_granted_at", null);
  }

  return { traveler: travelerRes, guardian: guardianRes };
}

export async function manualPointAdjustment(params: {
  userId: string;
  amount: number;
  reason: string;
  policyVersion: string;
  idempotencyKey: string;
}): Promise<ApplyLedgerResult> {
  if (!params.reason.trim()) return { inserted: false, ledgerId: null };
  return rpcApplyLedger({
    userId: params.userId,
    amount: params.amount,
    eventType: "manual_adjustment",
    eventRefType: null,
    eventRefId: null,
    reason: params.reason.trim(),
    policyVersion: params.policyVersion,
    idempotencyKey: params.idempotencyKey,
  });
}

export async function fetchLedgerForUser(userId: string, limit = 50) {
  const sb = createServiceRoleSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("point_ledger")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[points] fetchLedgerForUser", error);
    return [];
  }
  return data ?? [];
}

/**
 * 마이페이지 attention·배지용 — 전체 원장 row를 가져오지 않고 집계 + 최신 1건 id만 조회.
 * (이전: fetchLedgerForUser(80) 후 클라이언트식 필터 — 초고빈도 시 80건 상한으로 과소계 가능했음)
 */
export async function fetchLedgerAttentionSignals(
  userId: string,
  sinceIso: string,
): Promise<{ recentCount: number; latestEntryId: string }> {
  const sb = createServiceRoleSupabase();
  if (!sb) return { recentCount: 0, latestEntryId: "" };

  const [{ count, error: countErr }, { data: headRow, error: headErr }] = await Promise.all([
    sb
      .from("point_ledger")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("occurred_at", sinceIso),
    sb.from("point_ledger").select("id").eq("user_id", userId).order("occurred_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (countErr) {
    console.error("[points] fetchLedgerAttentionSignals count query failed", countErr);
  }
  if (headErr) {
    console.error("[points] fetchLedgerAttentionSignals latest-id head failed", headErr);
  }
  if (!countErr && count === null && !ledgerAttentionCountNullWarned) {
    ledgerAttentionCountNullWarned = true;
    console.warn(
      "[points] fetchLedgerAttentionSignals: exact row count is null without error (logged once per process) — check Supabase project settings / RLS / count+head behavior",
    );
  }

  return {
    recentCount: typeof count === "number" ? count : 0,
    latestEntryId: headRow && typeof headRow.id === "string" ? headRow.id : "",
  };
}

async function fetchBalanceSnapshotUncached(userId: string) {
  const sb = createServiceRoleSupabase();
  if (!sb) return null;

  const { data, error } = await sb.from("point_balance_snapshot").select("*").eq("user_id", userId).maybeSingle();
  if (error) {
    console.error("[points] fetchBalanceSnapshot", error);
    return null;
  }
  return data;
}

/** 동일 RSC 요청에서 허브 스냅샷·포인트 번들이 각각 호출해도 DB 1회로 합쳐진다. */
export const fetchBalanceSnapshot = cache(fetchBalanceSnapshotUncached);
