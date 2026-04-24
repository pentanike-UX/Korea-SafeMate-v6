import { tryGrantMatchRewards } from "@/lib/points/point-ledger-service";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export async function createMatchRecord(params: {
  travelerUserId: string;
  guardianUserId: string;
  bookingId?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const sb = createServiceRoleSupabase();
  if (!sb) return { ok: false, error: "Supabase not configured" };
  if (params.travelerUserId === params.guardianUserId) return { ok: false, error: "Invalid participants" };

  const { data, error } = await sb
    .from("matches")
    .insert({
      traveler_user_id: params.travelerUserId,
      guardian_user_id: params.guardianUserId,
      booking_id: params.bookingId ?? null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function confirmMatchSide(
  matchId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = createServiceRoleSupabase();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data: m, error } = await sb
    .from("matches")
    .select("id, traveler_user_id, guardian_user_id")
    .eq("id", matchId)
    .maybeSingle();

  if (error || !m) return { ok: false, error: "Match not found" };

  const now = new Date().toISOString();
  const patch: { traveler_confirmed_at?: string; guardian_confirmed_at?: string } = {};
  if (m.traveler_user_id === userId) patch.traveler_confirmed_at = now;
  else if (m.guardian_user_id === userId) patch.guardian_confirmed_at = now;
  else return { ok: false, error: "Not a participant" };

  const { error: ue } = await sb.from("matches").update(patch).eq("id", matchId);
  if (ue) return { ok: false, error: ue.message };

  await tryGrantMatchRewards(matchId);
  return { ok: true };
}
