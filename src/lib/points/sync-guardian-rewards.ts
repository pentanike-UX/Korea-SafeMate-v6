import { tryGrantGuardianProfileReward } from "@/lib/points/point-ledger-service";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export async function syncAllGuardianProfileRewards(): Promise<{
  processed: number;
  newlyGranted: number;
  error?: string;
}> {
  const sb = createServiceRoleSupabase();
  if (!sb) return { processed: 0, newlyGranted: 0, error: "Supabase not configured" };

  const { data, error } = await sb.from("guardian_profiles").select("user_id");
  if (error) return { processed: 0, newlyGranted: 0, error: error.message };

  let granted = 0;
  for (const row of data ?? []) {
    const r = await tryGrantGuardianProfileReward(row.user_id);
    if (r.inserted) granted += 1;
  }

  return { processed: data?.length ?? 0, newlyGranted: granted };
}
