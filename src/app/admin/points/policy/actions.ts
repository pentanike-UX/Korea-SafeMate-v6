"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import {
  activatePointPolicyVersion,
  createPointPolicyVersion,
  getActivePointPolicy,
} from "@/lib/points/point-policy-repository";
import { manualPointAdjustment } from "@/lib/points/point-ledger-service";
import { syncAllGuardianProfileRewards } from "@/lib/points/sync-guardian-rewards";

function num(fd: FormData, key: string, fallback: number) {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(fd: FormData, key: string, fallback: string) {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function bool(fd: FormData, key: string) {
  return fd.get(key) === "on" || fd.get(key) === "true";
}

function boolOr(fd: FormData, key: string, defaultVal: boolean) {
  const v = fd.get(key);
  if (v === null) return defaultVal;
  return v === "on" || v === "true";
}

export async function createPointPolicyAction(formData: FormData): Promise<void> {
  const version_code = str(formData, "version_code", "");
  if (!version_code) {
    console.error("[admin points] version_code required");
    return;
  }

  const res = await createPointPolicyVersion({
    version_code,
    profile_signup_reward: num(formData, "profile_signup_reward", 300),
    profile_reward_timing: str(formData, "profile_reward_timing", "immediate") as "immediate" | "approval",
    post_publish_reward: num(formData, "post_publish_reward", 100),
    post_reward_timing: str(formData, "post_reward_timing", "immediate") as "immediate" | "approval",
    post_daily_limit: num(formData, "post_daily_limit", 300),
    post_monthly_limit: num(formData, "post_monthly_limit", 3000),
    match_complete_reward: num(formData, "match_complete_reward", 700),
    allow_revoke_on_post_delete: boolOr(formData, "allow_revoke_on_post_delete", true),
    allow_revoke_on_policy_violation: boolOr(formData, "allow_revoke_on_policy_violation", true),
    set_active: bool(formData, "set_active"),
  });

  if (!res.ok) {
    console.error("[admin points] create policy", res.error);
    return;
  }

  revalidatePath("/admin/points/policy");
  revalidatePath("/admin/points");
}

export async function activatePolicyVersionAction(formData: FormData): Promise<void> {
  const id = str(formData, "policy_id", "");
  if (!id) {
    console.error("[admin points] policy_id required");
    return;
  }

  const res = await activatePointPolicyVersion(id);
  if (!res.ok) {
    console.error("[admin points] activate", res.error);
    return;
  }

  revalidatePath("/admin/points/policy");
  revalidatePath("/admin/points");
}

export async function manualPointAdjustmentAction(formData: FormData): Promise<void> {
  const userId = str(formData, "user_id", "");
  const amount = num(formData, "amount", 0);
  const reason = str(formData, "reason", "");
  if (!userId) {
    console.error("[admin points] user_id required");
    return;
  }
  if (!reason) {
    console.error("[admin points] reason required");
    return;
  }
  if (amount === 0) {
    console.error("[admin points] amount must be non-zero");
    return;
  }

  const policy = await getActivePointPolicy();
  const version = policy?.version_code ?? "manual";

  const res = await manualPointAdjustment({
    userId,
    amount,
    reason,
    policyVersion: version,
    idempotencyKey: `manual-adjustment:${randomUUID()}`,
  });

  if (!res.inserted) {
    console.error("[admin points] manual adjustment failed");
    return;
  }

  revalidatePath("/admin/points/policy");
  revalidatePath("/admin/points/adjust");
  revalidatePath("/mypage/points");
}

export async function syncGuardianProfileRewardsAction(): Promise<void> {
  await syncAllGuardianProfileRewards();
  revalidatePath("/admin/points/policy");
  revalidatePath("/admin/points");
}
