import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import type { PointPolicyVersionRow } from "@/lib/points/types";

export async function getActivePointPolicy(): Promise<PointPolicyVersionRow | null> {
  const sb = createServiceRoleSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("point_policy_versions")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[points] getActivePointPolicy", error);
    return null;
  }
  return data as PointPolicyVersionRow | null;
}

export async function listPointPolicyVersions(): Promise<PointPolicyVersionRow[]> {
  const sb = createServiceRoleSupabase();
  if (!sb) return [];

  const { data, error } = await sb.from("point_policy_versions").select("*").order("effective_from", { ascending: false });

  if (error) {
    console.error("[points] listPointPolicyVersions", error);
    return [];
  }
  return (data ?? []) as PointPolicyVersionRow[];
}

export async function activatePointPolicyVersion(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = createServiceRoleSupabase();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { error: off } = await sb.from("point_policy_versions").update({ is_active: false }).eq("is_active", true);
  if (off) return { ok: false, error: off.message };

  const { error: on } = await sb.from("point_policy_versions").update({ is_active: true }).eq("id", id);
  if (on) return { ok: false, error: on.message };

  return { ok: true };
}

export type PointPolicyUpsertInput = {
  version_code: string;
  profile_signup_reward: number;
  profile_reward_timing: PointPolicyVersionRow["profile_reward_timing"];
  post_publish_reward: number;
  post_reward_timing: PointPolicyVersionRow["post_reward_timing"];
  post_daily_limit: number;
  post_monthly_limit: number;
  match_complete_reward: number;
  allow_revoke_on_post_delete: boolean;
  allow_revoke_on_policy_violation: boolean;
  set_active?: boolean;
  created_by_user_id?: string | null;
};

export async function createPointPolicyVersion(
  input: PointPolicyUpsertInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const sb = createServiceRoleSupabase();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const row = {
    version_code: input.version_code,
    profile_signup_reward: input.profile_signup_reward,
    profile_reward_timing: input.profile_reward_timing,
    post_publish_reward: input.post_publish_reward,
    post_reward_timing: input.post_reward_timing,
    post_daily_limit: input.post_daily_limit,
    post_monthly_limit: input.post_monthly_limit,
    match_complete_reward: input.match_complete_reward,
    match_reward_timing: "confirmed_only" as const,
    allow_revoke_on_post_delete: input.allow_revoke_on_post_delete,
    allow_revoke_on_policy_violation: input.allow_revoke_on_policy_violation,
    is_active: false,
    effective_from: new Date().toISOString(),
    created_by_user_id: input.created_by_user_id ?? null,
  };

  const { data, error } = await sb.from("point_policy_versions").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };

  if (input.set_active) {
    const act = await activatePointPolicyVersion(data.id);
    if (!act.ok) return { ok: false, error: act.error };
  }

  return { ok: true, id: data.id };
}
