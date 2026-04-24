import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isMockGuardianId } from "@/lib/dev/mock-guardian-auth";
import { listPublicGuardiansMerged } from "@/lib/guardian-public-merged.server";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { getTravelerSavedGuardianIdsUnified } from "@/lib/traveler-saved-unified.server";
import {
  TRAVELER_SAVED_GUARDIANS_COOKIE,
  parseSavedGuardianIds,
  serializeSavedGuardianIds,
} from "@/lib/traveler-saved-guardians-cookie";
import { isUuidString } from "@/lib/guardian-posts-api";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  secure: process.env.NODE_ENV === "production",
};

export async function GET() {
  const travelerId = await getSupabaseAuthUserIdOnly();
  if (travelerId && !isMockGuardianId(travelerId)) {
    const ids = await getTravelerSavedGuardianIdsUnified(travelerId);
    return NextResponse.json({ ids });
  }
  const jar = await cookies();
  const ids = parseSavedGuardianIds(jar.get(TRAVELER_SAVED_GUARDIANS_COOKIE)?.value);
  return NextResponse.json({ ids });
}

export async function POST(req: Request) {
  let body: { guardian_user_id?: string; action?: "add" | "remove" | "toggle" };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.guardian_user_id === "string" ? body.guardian_user_id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "guardian_user_id required" }, { status: 400 });
  }

  const publicGuardians = await listPublicGuardiansMerged();
  const validIds = new Set(publicGuardians.map((g) => g.user_id));
  if (!validIds.has(id)) {
    return NextResponse.json({ error: "Unknown guardian" }, { status: 404 });
  }

  const action = body.action ?? "toggle";
  const travelerId = await getSupabaseAuthUserIdOnly();

  if (travelerId && !isMockGuardianId(travelerId) && isUuidString(id)) {
    const sb = await getServerSupabaseForUser();
    if (!sb) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });

    const jar = await cookies();
    const cookieIds = parseSavedGuardianIds(jar.get(TRAVELER_SAVED_GUARDIANS_COOKIE)?.value);
    const hadDb =
      (
        await sb
          .from("traveler_saved_guardians")
          .select("guardian_user_id")
          .eq("traveler_user_id", travelerId)
          .eq("guardian_user_id", id)
          .maybeSingle()
      ).data != null;
    const had = hadDb || cookieIds.includes(id);

    if (action === "remove" || (action === "toggle" && had)) {
      await sb.from("traveler_saved_guardians").delete().eq("traveler_user_id", travelerId).eq("guardian_user_id", id);
    } else if (action === "add" || (action === "toggle" && !had)) {
      await sb.from("traveler_saved_guardians").upsert(
        { traveler_user_id: travelerId, guardian_user_id: id },
        { onConflict: "traveler_user_id,guardian_user_id" },
      );
    }

    const { data: rows } = await sb
      .from("traveler_saved_guardians")
      .select("guardian_user_id")
      .eq("traveler_user_id", travelerId)
      .order("created_at", { ascending: false });
    const ids = (rows ?? []).map((r) => r.guardian_user_id as string);
    const saved = ids.includes(id);
    const res = NextResponse.json({ ids, saved });
    res.cookies.set(TRAVELER_SAVED_GUARDIANS_COOKIE, serializeSavedGuardianIds([]), { ...COOKIE_OPTIONS, maxAge: 0 });
    return res;
  }

  const jar = await cookies();
  let ids = parseSavedGuardianIds(jar.get(TRAVELER_SAVED_GUARDIANS_COOKIE)?.value);
  const had = ids.includes(id);

  if (action === "remove") {
    ids = ids.filter((x) => x !== id);
  } else if (action === "add") {
    if (!had) ids = [...ids, id];
  } else {
    ids = had ? ids.filter((x) => x !== id) : [...ids, id];
  }

  const saved = ids.includes(id);
  const res = NextResponse.json({ ids, saved });
  res.cookies.set(TRAVELER_SAVED_GUARDIANS_COOKIE, serializeSavedGuardianIds(ids), COOKIE_OPTIONS);
  return res;
}
