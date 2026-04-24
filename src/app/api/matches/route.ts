import { NextResponse } from "next/server";
import { createMatchRecord } from "@/lib/points/match-service";

export async function POST(req: Request) {
  let body: { traveler_user_id?: string; guardian_user_id?: string; booking_id?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const t = typeof body.traveler_user_id === "string" ? body.traveler_user_id.trim() : "";
  const g = typeof body.guardian_user_id === "string" ? body.guardian_user_id.trim() : "";
  if (!t || !g) {
    return NextResponse.json({ error: "traveler_user_id and guardian_user_id required" }, { status: 400 });
  }

  const res = await createMatchRecord({
    travelerUserId: t,
    guardianUserId: g,
    bookingId: typeof body.booking_id === "string" ? body.booking_id : body.booking_id ?? null,
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json({ id: res.id });
}
