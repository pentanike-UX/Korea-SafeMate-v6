import { NextResponse } from "next/server";
import { createMatchRecord } from "@/lib/points/match-service";
import { normalizeGuardianRef } from "@/lib/guardian-id-normalize.server";

export async function POST(req: Request) {
  let body: { traveler_user_id?: string; guardian_user_id?: string; booking_id?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const t = typeof body.traveler_user_id === "string" ? body.traveler_user_id.trim() : "";
  const gInput = typeof body.guardian_user_id === "string" ? body.guardian_user_id.trim() : "";
  if (!t || !gInput) {
    return NextResponse.json({ error: "traveler_user_id and guardian_user_id required" }, { status: 400 });
  }

  const norm = await normalizeGuardianRef(gInput);
  if (!norm.ok) {
    const status = norm.reason === "invalid" ? 400 : 404;
    return NextResponse.json({ error: norm.reason === "invalid" ? "guardian_user_id invalid" : "guardian_not_found" }, { status });
  }

  const res = await createMatchRecord({
    travelerUserId: t,
    guardianUserId: norm.uuid,
    bookingId: typeof body.booking_id === "string" ? body.booking_id : body.booking_id ?? null,
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json({ id: res.id });
}
