import { NextResponse } from "next/server";
import {
  loadMypagePointsData,
  MYPAGE_POINTS_LEDGER_LIMIT,
  toMypagePointsApiResponse,
} from "@/lib/points/mypage-points-data.server";
import { getSessionUserId } from "@/lib/supabase/server-user";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bundle = await loadMypagePointsData(userId, MYPAGE_POINTS_LEDGER_LIMIT);
  return NextResponse.json(toMypagePointsApiResponse(userId, bundle));
}
