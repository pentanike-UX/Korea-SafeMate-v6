import { NextResponse } from "next/server";
import { syncAllGuardianProfileRewards } from "@/lib/points/sync-guardian-rewards";

/** Batch-apply guardian profile rewards according to active policy (idempotent). */
export async function POST() {
  const res = await syncAllGuardianProfileRewards();
  if (res.error === "Supabase not configured") {
    return NextResponse.json({ error: res.error }, { status: 503 });
  }
  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: 500 });
  }
  return NextResponse.json({ processed: res.processed, newlyGranted: res.newlyGranted });
}
