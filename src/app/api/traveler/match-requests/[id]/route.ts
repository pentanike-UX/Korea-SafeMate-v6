import { NextResponse } from "next/server";
import { getMockGuardianIdFromCookies } from "@/lib/dev/mock-guardian-cookies.server";
import {
  parseMatchRequests,
  serializeMatchRequests,
  TRAVELER_MATCH_REQUESTS_COOKIE,
  type MatchRequestStatus,
  type StoredMatchRequest,
} from "@/lib/traveler-match-requests";
import { cookieOpts } from "@/lib/traveler-match-requests.server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

async function resolveActorId(): Promise<string | null> {
  const mock = await getMockGuardianIdFromCookies();
  if (mock) return mock;
  const sb = await getServerSupabaseForUser();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user?.id ?? null;
}

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const actorId = await resolveActorId();
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let body: { status?: MatchRequestStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nextStatus = body.status;
  if (nextStatus !== "accepted" && nextStatus !== "completed") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const jar = await import("next/headers").then((m) => m.cookies());
  const all = parseMatchRequests(jar.get(TRAVELER_MATCH_REQUESTS_COOKIE)?.value);
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = all[idx]!;
  const isTraveler = row.traveler_user_id === actorId;
  const isGuardian = row.guardian_user_id === actorId;
  if (!isTraveler && !isGuardian) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (nextStatus === "accepted" && !isGuardian) {
    return NextResponse.json({ error: "Only guardian can accept" }, { status: 403 });
  }
  if (nextStatus === "completed" && !isTraveler) {
    return NextResponse.json({ error: "Only traveler can complete" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const updated: StoredMatchRequest = { ...row, status: nextStatus, updated_at: now };
  const next = [...all];
  next[idx] = updated;

  const res = NextResponse.json({ ok: true, item: updated });
  res.cookies.set(TRAVELER_MATCH_REQUESTS_COOKIE, serializeMatchRequests(next), cookieOpts());
  return res;
}
