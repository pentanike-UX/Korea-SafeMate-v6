import { NextResponse } from "next/server";
import {
  newMatchRequestRow,
  parseMatchRequests,
  serializeMatchRequests,
  TRAVELER_MATCH_REQUESTS_COOKIE,
  type StoredMatchRequest,
} from "@/lib/traveler-match-requests";
import { cookieOpts, getMatchRequestsForTraveler } from "@/lib/traveler-match-requests.server";
import { getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { createMatchRecord } from "@/lib/points/match-service";

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export async function GET() {
  const travelerId = await getSupabaseAuthUserIdOnly();
  if (!travelerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await getMatchRequestsForTraveler(travelerId);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const travelerId = await getSupabaseAuthUserIdOnly();
  if (!travelerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { guardian_user_id?: string; guardian_display_name?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const gid = typeof body.guardian_user_id === "string" ? body.guardian_user_id.trim() : "";
  if (!gid) return NextResponse.json({ error: "guardian_user_id required" }, { status: 400 });
  const gname = typeof body.guardian_display_name === "string" ? body.guardian_display_name.trim() : null;

  if (isUuid(travelerId) && isUuid(gid)) {
    const db = await createMatchRecord({ travelerUserId: travelerId, guardianUserId: gid, bookingId: null });
    if (db.ok) {
      return NextResponse.json({ ok: true, id: db.id, source: "db" as const });
    }
  }

  const jar = await import("next/headers").then((m) => m.cookies());
  const all = parseMatchRequests(jar.get(TRAVELER_MATCH_REQUESTS_COOKIE)?.value);
  const dup = all.some((r) => r.traveler_user_id === travelerId && r.guardian_user_id === gid && r.status === "requested");
  if (dup) {
    return NextResponse.json({ error: "already_requested" }, { status: 409 });
  }

  const row = newMatchRequestRow(travelerId, gid, gname);
  const next: StoredMatchRequest[] = [...all, row];
  const res = NextResponse.json({ ok: true, id: row.id, source: "cookie" as const });
  res.cookies.set(TRAVELER_MATCH_REQUESTS_COOKIE, serializeMatchRequests(next), cookieOpts());
  return res;
}
