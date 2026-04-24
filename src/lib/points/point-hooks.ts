import { tryGrantPostReward, tryRevokePostReward } from "@/lib/points/point-ledger-service";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

/** Call after content_posts insert/update (service-role context). */
export async function processContentPostPointsAfterWrite(postId: string): Promise<void> {
  const sb = createServiceRoleSupabase();
  if (!sb) return;

  const { data: row, error } = await sb
    .from("content_posts")
    .select(
      "id, author_user_id, status, reviewed_by_user_id, moderation_reward_ok, reward_granted_at, reward_revoked_at",
    )
    .eq("id", postId)
    .maybeSingle();

  if (error || !row) return;

  const ctx = {
    id: row.id,
    author_user_id: row.author_user_id,
    status: row.status as string,
    reviewed_by_user_id: row.reviewed_by_user_id,
    moderation_reward_ok: Boolean(row.moderation_reward_ok),
    reward_granted_at: row.reward_granted_at,
    reward_revoked_at: row.reward_revoked_at,
  };

  if (row.status === "approved") {
    await tryGrantPostReward(ctx);
    return;
  }

  if (row.status === "rejected") {
    await tryRevokePostReward(postId, row.author_user_id, "policy");
    return;
  }

  if (row.status === "draft" || row.status === "pending") {
    await tryRevokePostReward(postId, row.author_user_id, "hidden");
  }
}
