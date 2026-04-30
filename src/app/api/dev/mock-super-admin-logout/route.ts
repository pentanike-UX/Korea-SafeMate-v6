import { NextResponse } from "next/server";
import { MOCK_SUPER_ADMIN_COOKIE_NAME, isSuperAdminLoginEnabled } from "@/lib/dev/mock-super-admin-auth";

/**
 * 슈퍼관리자 모의 쿠키를 제거합니다.
 * ENABLE_SUPER_ADMIN_LOGIN=1 이 아니면 404입니다.
 */
export async function POST() {
  if (!isSuperAdminLoginEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(MOCK_SUPER_ADMIN_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    httpOnly: false,
  });
  return res;
}
