/**
 * GET   /api/guardian/ai-reply-settings — AI 자동답변 설정 조회
 * PATCH /api/guardian/ai-reply-settings — AI 자동답변 켜기/끄기
 */
import { NextResponse } from "next/server";
import { getSessionUserId, getServerSupabaseForUser } from "@/lib/supabase/server-user";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { data, error } = await sb
    .from("guardian_profiles")
    .select("ai_auto_reply_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No guardian profile" }, { status: 404 });

  return NextResponse.json({ ai_auto_reply_enabled: data.ai_auto_reply_enabled });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { ai_auto_reply_enabled: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.ai_auto_reply_enabled !== "boolean") {
    return NextResponse.json({ error: "ai_auto_reply_enabled (boolean) required" }, { status: 400 });
  }

  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { error } = await sb
    .from("guardian_profiles")
    .update({ ai_auto_reply_enabled: body.ai_auto_reply_enabled })
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ai_auto_reply_enabled: body.ai_auto_reply_enabled });
}
