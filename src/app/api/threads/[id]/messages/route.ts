/**
 * GET  /api/threads/[id]/messages — 메시지 목록 (최신 100건)
 * POST /api/threads/[id]/messages — 메시지 전송 + AI 자동답변 트리거
 */
import { NextResponse } from "next/server";
import { getSessionUserId, getServerSupabaseForUser } from "@/lib/supabase/server-user";

type Params = { params: Promise<{ id: string }> };

// ── GET: 메시지 조회 ──────────────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  const { id: threadId } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  // 참여 권한 확인
  const { data: thread } = await sb
    .from("message_threads")
    .select("id, traveler_user_id, guardian_user_id")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  if (thread.traveler_user_id !== userId && thread.guardian_user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: messages, error } = await sb
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 상대방 메시지 읽음 처리
  await sb
    .from("messages")
    .update({ is_read: true })
    .eq("thread_id", threadId)
    .neq("sender_user_id", userId)
    .eq("is_read", false);

  return NextResponse.json({ messages: messages ?? [] });
}

// ── POST: 메시지 전송 ─────────────────────────────────────────────────────────
export async function POST(req: Request, { params }: Params) {
  const { id: threadId } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { content: string; content_type?: "text" | "image" | "route_preview" };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  // 참여 권한 + 역할 확인
  const { data: thread } = await sb
    .from("message_threads")
    .select("id, traveler_user_id, guardian_user_id")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const isGuardian = thread.guardian_user_id === userId;
  const isTraveler = thread.traveler_user_id === userId;
  if (!isGuardian && !isTraveler) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const senderRole = isGuardian ? "guardian" : "traveler";

  // 메시지 삽입
  const { data: message, error: msgErr } = await sb
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_user_id: userId,
      sender_role: senderRole,
      content: body.content.trim(),
      content_type: body.content_type ?? "text",
    })
    .select()
    .single();

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  // last_message_at 갱신
  await sb
    .from("message_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", threadId);

  // ── AI 자동답변 트리거 (여행자가 보낸 경우만) ──────────────────────────────
  if (isTraveler) {
    const { data: guardianProfile } = await sb
      .from("guardian_profiles")
      .select("ai_auto_reply_enabled, display_name")
      .eq("user_id", thread.guardian_user_id)
      .maybeSingle();

    if (guardianProfile?.ai_auto_reply_enabled) {
      const aiReply = await generateAiReply(body.content.trim(), guardianProfile.display_name ?? "하루이");

      await sb.from("messages").insert({
        thread_id: threadId,
        sender_user_id: thread.guardian_user_id,
        sender_role: "guardian",
        content: aiReply,
        content_type: "text",
        is_ai_reply: true,
      });

      await sb
        .from("message_threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", threadId);
    }
  }

  return NextResponse.json({ message }, { status: 201 });
}

// ── AI 자동답변 생성 ──────────────────────────────────────────────────────────
async function generateAiReply(userMessage: string, guardianName: string): Promise<string> {
  // TODO(ai): Replace with real LLM call (OpenAI / Vercel AI Gateway).
  // Pattern: POST https://ai-gateway.vercel.sh/v1/chat/completions
  //   with Authorization: Bearer ${process.env.AI_GATEWAY_API_KEY}
  //   and system prompt about the guardian's profile + route context.
  //
  // For now: context-aware template responses.

  const lower = userMessage.toLowerCase();

  if (lower.includes("동행") || lower.includes("같이")) {
    return `안녕하세요! 저는 ${guardianName}의 AI 어시스턴트예요. 동행 관련 문의 감사드려요 😊 원하시는 날짜와 인원을 알려주시면 ${guardianName}이 직접 확인 후 빠르게 답변 드릴 거예요.`;
  }
  if (lower.includes("일정") || lower.includes("날짜") || lower.includes("언제")) {
    return `안녕하세요! 일정 문의 주셔서 감사해요. ${guardianName}의 현재 가능한 일정은 요청하기를 통해 상세하게 조율하실 수 있어요. 원하시는 날짜 범위를 알려주세요!`;
  }
  if (lower.includes("가격") || lower.includes("비용") || lower.includes("얼마")) {
    return `가격 문의 감사드려요. ${guardianName}의 서비스 요금은 일정·인원·코스에 따라 달라져요. '요청하기'로 세부 내용을 남겨주시면 맞춤 견적을 드릴게요.`;
  }
  if (lower.includes("언어") || lower.includes("영어") || lower.includes("소통")) {
    return `${guardianName}은 영어로 소통 가능해요! 기본적인 영어 안내는 물론, 필요 시 번역 앱도 함께 활용해요. 걱정 마세요 😊`;
  }

  return `안녕하세요! ${guardianName}의 AI 어시스턴트예요. 문의 주셔서 감사해요. ${guardianName}이 직접 확인 후 빠른 시간 내 답변 드릴게요! 더 급한 건 '요청하기'를 이용해 주세요 🙏`;
}
