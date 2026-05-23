import { NextResponse } from "next/server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

const RESIDENCE_BUCKET = "guardian-docs";

/**
 * 관리자가 지원자의 거주 증빙 문서를 열람.
 * 비공개 버킷이므로 service-role로 단기 서명 URL을 만들어 302 리다이렉트.
 * 인증: 실제 세션 + app_role ∈ {admin, super_admin}.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ applicationId: string }> }) {
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
  const svc = createServiceRoleSupabase();
  if (!svc) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const { data: app } = await svc
    .from("guardian_applications")
    .select("residence_proof")
    .eq("id", applicationId)
    .maybeSingle();
  const path = app?.residence_proof as string | null | undefined;
  if (!path) return NextResponse.json({ error: "no_document" }, { status: 404 });

  const { data: signed, error } = await svc.storage.from(RESIDENCE_BUCKET).createSignedUrl(path, 60);
  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: "sign_failed", detail: error?.message }, { status: 500 });
  }
  return NextResponse.redirect(signed.signedUrl);
}
