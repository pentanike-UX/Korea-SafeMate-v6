import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

/**
 * 관리자 가디언 지원 리뷰 액션.
 *  - approve          → status='approved'
 *  - reject           → status='rejected'
 *  - request_revision → status='needs_revision'
 *
 * 인증: 실제 세션 + users.app_role ∈ {admin, super_admin}.
 * 쓰기: service-role(RLS admin 정책이 'admin'만 매칭 → super_admin 위해 우회 + reviewer_id 기록).
 */
const bodySchema = z.object({
  action: z.enum(["approve", "reject", "request_revision"]),
  note: z.string().trim().max(2000).optional(),
});

const ACTION_TO_STATUS = {
  approve: "approved",
  reject: "rejected",
  request_revision: "needs_revision",
} as const;

export async function POST(req: Request, ctx: { params: Promise<{ applicationId: string }> }) {
  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: urow } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  if (!urow || !["admin", "super_admin"].includes(urow.app_role as string)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { applicationId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", detail: parsed.error.format() }, { status: 400 });
  }

  const nextStatus = ACTION_TO_STATUS[parsed.data.action];
  const svc = createServiceRoleSupabase();
  if (!svc) {
    return NextResponse.json({
      ok: true,
      mock: true,
      note: "Service-role supabase unavailable — action acknowledged, no DB write.",
      action: parsed.data.action,
      next_status: nextStatus,
    });
  }

  const { data, error } = await svc
    .from("guardian_applications")
    .update({
      status: nextStatus,
      reviewer_id: user.id,
      review_note: parsed.data.note ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .select("id, status, user_id, display_name, real_name")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "db_update_failed", detail: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // 승인 시 guardian_profiles로 브리지 → app_role이 OAuth sync에서 guardian으로 승격.
  if (parsed.data.action === "approve") {
    const applicantId = data.user_id as string;
    const displayName = (data.display_name as string | null) ?? (data.real_name as string | null) ?? "Guardian";
    await svc
      .from("guardian_profiles")
      .upsert({ user_id: applicantId, display_name: displayName, approval_status: "approved" }, { onConflict: "user_id" });
    // 즉시 반영(재로그인 불필요) — 단, admin/super_admin은 강등 금지.
    await svc
      .from("users")
      .update({ app_role: "guardian" })
      .eq("id", applicantId)
      .not("app_role", "in", "(admin,super_admin)");
  }

  return NextResponse.json({ ok: true, mock: false, action: parsed.data.action, application: { id: data.id, status: data.status } });
}
