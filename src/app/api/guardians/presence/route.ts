/**
 * POST /api/guardians/presence — guardian heartbeat (auth required).
 * Effect: guardian_profiles.last_seen_at = now() where user_id = auth.uid().
 * Throttle: clients should call no more than once per 60s; the route is idempotent.
 */
import { NextResponse } from "next/server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

export async function POST() {
  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date().toISOString();
  const { error } = await sb
    .from("guardian_profiles")
    .update({ last_seen_at: now })
    .eq("user_id", userId);

  if (error) {
    // Not a guardian row → ignore silently (200) so non-guardian sessions don't error.
    if (error.code === "PGRST116") return NextResponse.json({ ok: true, skipped: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, last_seen_at: now });
}
