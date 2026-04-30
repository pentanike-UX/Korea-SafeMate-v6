import { NextResponse } from "next/server";
import {
  MOCK_SUPER_ADMIN_COOKIE_NAME,
  MOCK_SUPER_ADMIN_COOKIE_VALUE,
  isSuperAdminLoginEnabled,
} from "@/lib/dev/mock-super-admin-auth";

/**
 * 슈퍼관리자 쿠키 세션을 생성합니다.
 * ENABLE_SUPER_ADMIN_LOGIN=1 환경변수가 없으면 404를 반환합니다.
 */
export async function POST() {
  if (!isSuperAdminLoginEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(MOCK_SUPER_ADMIN_COOKIE_NAME, MOCK_SUPER_ADMIN_COOKIE_VALUE, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h — 상대적으로 짧게
    httpOnly: false,
  });
  return res;
}
