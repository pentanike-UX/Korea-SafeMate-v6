import { NextResponse } from "next/server";
import { getGuardianSeedRow, isMockGuardianId, MOCK_GUARDIAN_COOKIE_NAME } from "@/lib/dev/mock-guardian-auth";

/**
 * Dev/demo: 가디언 시드 ID로 쿠키 세션을 만듭니다. Google OAuth와 무관합니다.
 * 클라이언트는 `loginAsMockGuardian`으로만 호출하는 것을 권장(포인트 캐시 무효화 + 탭 간 `broadcastClientAuthContextChanged`).
 * 제거: 이 라우트 + `mock-guardian-logout` + `MockGuardianQuickLogin` 컴포넌트 삭제.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const guardianId = (body as { guardianId?: string }).guardianId;
  if (!isMockGuardianId(guardianId) || !getGuardianSeedRow(guardianId)) {
    return NextResponse.json({ error: "Invalid guardian id" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(MOCK_GUARDIAN_COOKIE_NAME, guardianId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: false,
  });
  return res;
}
