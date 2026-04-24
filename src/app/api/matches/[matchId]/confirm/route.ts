import { NextResponse } from "next/server";
import { confirmMatchSide } from "@/lib/points/match-service";
import { getSessionUserId } from "@/lib/supabase/server-user";

type Ctx = { params: Promise<{ matchId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await ctx.params;
  const res = await confirmMatchSide(matchId, userId);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.error === "Not a participant" ? 403 : 400 });
  }
  return NextResponse.json({ ok: true });
}
