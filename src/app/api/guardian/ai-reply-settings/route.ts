/**
 * GET   /api/guardian/ai-reply-settings — AI 자동답변 설정 조회
 * PATCH /api/guardian/ai-reply-settings — AI 자동답변 켜기/끄기
 *
 * 모의 하루이(mgXX)은 Supabase JWT 가 없으므로 service_role + 실 UUID 매핑 사용.
 */
import { NextResponse } from "next/server";
import { getSessionUserId, getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { isMockGuardianId, sessionUserIdToDbParticipantId } from "@/lib/dev/mock-guardian-auth";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export async function GET() {
  const sessionId = await getSessionUserId();
  if (!sessionId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = sessionUserIdToDbParticipantId(sessionId);
  const useSvc = isMockGuardianId(sessionId);

  const userSb = await getServerSupabaseForUser();
  const svc = createServiceRoleSupabase();
  const sb = useSvc ? svc : userSb;
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { data, error } = await sb
    .from("guardian_profiles")
    .select("ai_auto_reply_enabled")
    .eq("user_id", dbUserId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ai_auto_reply_enabled: false });

  return NextResponse.json({ ai_auto_reply_enabled: Boolean(data.ai_auto_reply_enabled) });
}

export async function PATCH(req: Request) {
  const sessionId = await getSessionUserId();
  if (!sessionId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { ai_auto_reply_enabled: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.ai_auto_reply_enabled !== "boolean") {
    return NextResponse.json({ error: "ai_auto_reply_enabled (boolean) required" }, { status: 400 });
  }

  const dbUserId = sessionUserIdToDbParticipantId(sessionId);
  const useSvc = isMockGuardianId(sessionId);

  const userSb = await getServerSupabaseForUser();
  const svc = createServiceRoleSupabase();
  const sb = useSvc ? svc : userSb;
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { error } = await sb
    .from("guardian_profiles")
    .update({ ai_auto_reply_enabled: body.ai_auto_reply_enabled })
    .eq("user_id", dbUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ai_auto_reply_enabled: body.ai_auto_reply_enabled });
}
