import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  MOCK_SUPER_ADMIN_COOKIE_NAME,
  isMockSuperAdminCookieValue,
  isSuperAdminLoginEnabled,
} from "@/lib/dev/mock-super-admin-auth";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import type { ContentPostStatus } from "@/types/domain";

/**
 * 관리자 모더레이션 액션 — 본 단계는 mock-friendly.
 *
 * - approve  → status='approved'
 * - reject   → status='rejected'
 * - hide     → status='blocked'
 * - unhide   → status='approved'
 *
 * 포스트가 DB에 있으면 service-role로 업데이트.
 * mock 전용(시드 mock id)이면 200 + { mock: true }로 응답 (실제 변경 없음).
 *
 * 인증: 슈퍼관리자 쿠키 검증. ENABLE_SUPER_ADMIN_LOGIN=1 필요.
 */
const bodySchema = z.object({
  action: z.enum(["approve", "reject", "hide", "unhide"]),
});

const ACTION_TO_STATUS: Record<z.infer<typeof bodySchema>["action"], ContentPostStatus> = {
  approve: "approved",
  reject: "rejected",
  hide: "blocked",
  unhide: "approved",
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ postId: string }> },
) {
  // 인증
  if (!isSuperAdminLoginEnabled()) {
    return NextResponse.json({ error: "super_admin_disabled" }, { status: 403 });
  }
  const cookieStore = await cookies();
  if (!isMockSuperAdminCookieValue(cookieStore.get(MOCK_SUPER_ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { postId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", detail: parsed.error.format() }, { status: 400 });
  }

  const nextStatus = ACTION_TO_STATUS[parsed.data.action];
  const sb = createServiceRoleSupabase();
  if (!sb) {
    return NextResponse.json({
      ok: true,
      mock: true,
      note: "Service-role supabase unavailable — mock acknowledged, no DB write.",
      action: parsed.data.action,
      next_status: nextStatus,
    });
  }

  const { data, error } = await sb
    .from("content_posts")
    .update({ status: nextStatus })
    .eq("id", postId)
    .select("id, status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "db_update_failed", detail: error.message }, { status: 500 });
  }
  if (!data) {
    // DB에 없는 mock 포스트
    return NextResponse.json({
      ok: true,
      mock: true,
      note: "Post not in DB (mock seed). Action acknowledged but no row updated.",
      action: parsed.data.action,
      next_status: nextStatus,
    });
  }

  return NextResponse.json({ ok: true, mock: false, action: parsed.data.action, post: data });
}
