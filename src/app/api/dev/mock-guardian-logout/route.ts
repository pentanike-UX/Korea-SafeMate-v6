import { NextResponse } from "next/server";
import { MOCK_GUARDIAN_COOKIE_NAME } from "@/lib/dev/mock-guardian-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MOCK_GUARDIAN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
