import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isMockGuardianId } from "@/lib/dev/mock-guardian-auth";
import { isUuidString } from "@/lib/guardian-posts-api";
import { listApprovedPostsMerged } from "@/lib/posts-public-merged.server";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { getTravelerSavedPostIdsUnified } from "@/lib/traveler-saved-unified.server";
import {
  TRAVELER_SAVED_POSTS_COOKIE,
  parseSavedPostIds,
  serializeSavedPostIds,
} from "@/lib/traveler-saved-posts-cookie";

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
    const ids = await getTravelerSavedPostIdsUnified(travelerId);
    return NextResponse.json({ ids });
  }
  const jar = await cookies();
  const ids = parseSavedPostIds(jar.get(TRAVELER_SAVED_POSTS_COOKIE)?.value);
  return NextResponse.json({ ids });
}

export async function POST(req: Request) {
  let body: { post_id?: string; action?: "add" | "remove" | "toggle" };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.post_id === "string" ? body.post_id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "post_id required" }, { status: 400 });
  }

  const approved = await listApprovedPostsMerged();
  const validIds = new Set(approved.filter((p) => p.status === "approved").map((p) => p.id));
  if (!validIds.has(id)) {
    return NextResponse.json({ error: "Unknown post" }, { status: 404 });
  }

  const action = body.action ?? "toggle";
  const travelerId = await getSupabaseAuthUserIdOnly();

  if (travelerId && !isMockGuardianId(travelerId) && isUuidString(id)) {
    const sb = await getServerSupabaseForUser();
    if (!sb) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });

    const jar = await cookies();
    const cookieIds = parseSavedPostIds(jar.get(TRAVELER_SAVED_POSTS_COOKIE)?.value);
    const hadDb =
      (
        await sb
          .from("traveler_saved_posts")
          .select("post_id")
          .eq("traveler_user_id", travelerId)
          .eq("post_id", id)
          .maybeSingle()
      ).data != null;
    const had = hadDb || cookieIds.includes(id);

    if (action === "remove" || (action === "toggle" && had)) {
      await sb.from("traveler_saved_posts").delete().eq("traveler_user_id", travelerId).eq("post_id", id);
    } else if (action === "add" || (action === "toggle" && !had)) {
      await sb.from("traveler_saved_posts").upsert(
        { traveler_user_id: travelerId, post_id: id },
        { onConflict: "traveler_user_id,post_id" },
      );
    }

    const { data: rows } = await sb
      .from("traveler_saved_posts")
      .select("post_id")
      .eq("traveler_user_id", travelerId)
      .order("created_at", { ascending: false });
    const ids = (rows ?? []).map((r) => r.post_id as string);
    const saved = ids.includes(id);
    const res = NextResponse.json({ ids, saved });
    res.cookies.set(TRAVELER_SAVED_POSTS_COOKIE, serializeSavedPostIds([]), { ...COOKIE_OPTIONS, maxAge: 0 });
    return res;
  }

  const jar = await cookies();
  let ids = parseSavedPostIds(jar.get(TRAVELER_SAVED_POSTS_COOKIE)?.value);
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
  res.cookies.set(TRAVELER_SAVED_POSTS_COOKIE, serializeSavedPostIds(ids), COOKIE_OPTIONS);
  return res;
}
