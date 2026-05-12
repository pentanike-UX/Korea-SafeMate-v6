/**
 * GET  /api/threads/[id]/messages — 메시지 목록 (최신 100건)
 * POST /api/threads/[id]/messages — 메시지 전송 + AI 자동답변 트리거
 */
import { after } from "next/server";
import { NextResponse } from "next/server";
import { isMockGuardianId, sessionUserIdToDbParticipantId } from "@/lib/dev/mock-guardian-auth";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { getSessionUserId, getServerSupabaseForUser } from "@/lib/supabase/server-user";

type Params = { params: Promise<{ id: string }> };

// ── GET: 메시지 조회 ──────────────────────────────────────────────────────────
export async function GET(req: Request, { params }: Params) {
  const { id: threadId } = await params;
  const sessionId = await getSessionUserId();
  if (!sessionId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = sessionUserIdToDbParticipantId(sessionId);
  const useSvc = isMockGuardianId(sessionId);
  const userSb = await getServerSupabaseForUser();
  const svc = createServiceRoleSupabase();
  const sb = useSvc ? svc : userSb;
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { data: thread } = await sb
    .from("message_threads")
    .select("id, traveler_user_id, guardian_user_id")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  if (thread.traveler_user_id !== dbUserId && thread.guardian_user_id !== dbUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 폴링 백업용: ?since=<ISO> 가 있으면 그 시각 이후의 신규 메시지만 반환.
  // since 가 없으면 전체(최신 100건) 반환 — 기존 호출자 호환.
  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const isPoll = sinceParam !== null && sinceParam !== "";

  let query = sb
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (isPoll) {
    query = query.gt("created_at", sinceParam!);
  } else {
    query = query.limit(100);
  }

  const { data: messages, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 읽음 처리는 폴링에서도 안전(idempotent)
  const { error: readErr } = await sb
    .from("messages")
    .update({ is_read: true })
    .eq("thread_id", threadId)
    .neq("sender_user_id", dbUserId)
    .eq("is_read", false);

  if (readErr) {
    console.warn("[messages GET] read receipt update failed:", readErr.message);
  }

  return NextResponse.json({ messages: messages ?? [] });
}

// ── POST: 메시지 전송 ─────────────────────────────────────────────────────────
export async function POST(req: Request, { params }: Params) {
  const { id: threadId } = await params;
  const sessionId = await getSessionUserId();
  if (!sessionId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = sessionUserIdToDbParticipantId(sessionId);
  const useSvc = isMockGuardianId(sessionId);

  let body: { content: string; content_type?: "text" | "image" | "route_preview" };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const userSb = await getServerSupabaseForUser();
  const svc = createServiceRoleSupabase();
  const sb = useSvc ? svc : userSb;
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { data: thread, error: threadErr } = await sb
    .from("message_threads")
    .select("id, traveler_user_id, guardian_user_id, traveler_message_count, max_messages_traveler")
    .eq("id", threadId)
    .maybeSingle();

  if (threadErr) return NextResponse.json({ error: threadErr.message }, { status: 500 });
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const isGuardian = thread.guardian_user_id === dbUserId;
  const isTraveler = thread.traveler_user_id === dbUserId;
  if (!isGuardian && !isTraveler) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    isTraveler &&
    thread.traveler_message_count >= thread.max_messages_traveler
  ) {
    return NextResponse.json(
      {
        error: "traveler_message_limit",
        detail:
          "이 대화에서 보낼 수 있는 메시지 수에 도달했어요. 맞춤 요청이나 예약을 통해 이어가실 수 있어요.",
      },
      { status: 403 },
    );
  }

  const senderRole = isGuardian ? "guardian" : "traveler";

  const { data: message, error: msgErr } = await sb
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_user_id: dbUserId,
      sender_role: senderRole,
      content: body.content.trim(),
      content_type: body.content_type ?? "text",
    })
    .select()
    .single();

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  const { error: lmErr } = await sb
    .from("message_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", threadId);
  if (lmErr) {
    console.warn("[messages POST] last_message_at update:", lmErr.message);
  }

  if (isTraveler) {
    const gId = thread.guardian_user_id;
    const text = body.content.trim();
    after(() => {
      void triggerAiReplyWithServiceRole(threadId, gId, text);
    });
  }

  return NextResponse.json({ message }, { status: 201 });
}

// ── AI 자동답변 (서비스 롤 — RLS·세션 없는 after() 컨텍스트에서도 동작) ───────
async function triggerAiReplyWithServiceRole(
  threadId: string,
  guardianUserId: string,
  userMessage: string,
): Promise<void> {
  const svc = createServiceRoleSupabase();
  if (!svc) {
    console.warn("[AI reply] service role unavailable");
    return;
  }

  const { data: t, error: tErr } = await svc
    .from("message_threads")
    .select("id, guardian_user_id")
    .eq("id", threadId)
    .maybeSingle();
  if (tErr || !t || t.guardian_user_id !== guardianUserId) {
    console.warn("[AI reply] thread validation failed", tErr?.message);
    return;
  }

  const { data: guardianProfile } = await svc
    .from("guardian_profiles")
    .select("ai_auto_reply_enabled, display_name, headline, bio")
    .eq("user_id", guardianUserId)
    .maybeSingle();

  if (!guardianProfile?.ai_auto_reply_enabled) return;

  const { data: recentMessages } = await svc
    .from("messages")
    .select("sender_role, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(5);

  const history = (recentMessages ?? []).reverse();

  const aiContent = await generateAiReply({
    userMessage,
    guardianName: guardianProfile.display_name ?? "하루이",
    guardianHeadline: guardianProfile.headline ?? "",
    guardianBio: guardianProfile.bio ?? "",
    conversationHistory: history.map((m) => ({
      role: m.sender_role === "traveler" ? ("user" as const) : ("assistant" as const),
      content: m.content as string,
    })),
  });

  if (!aiContent) return;

  const body = `[자동 초답] ${aiContent}`;

  const { error: insErr } = await svc.from("messages").insert({
    thread_id: threadId,
    sender_user_id: guardianUserId,
    sender_role: "guardian",
    content: body,
    content_type: "text",
    is_ai_reply: true,
  });

  if (insErr) {
    console.error("[AI reply] insert failed:", insErr.message);
    return;
  }

  const { error: upErr } = await svc
    .from("message_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", threadId);
  if (upErr) {
    console.warn("[AI reply] last_message_at:", upErr.message);
  }
}

// ── Vercel AI Gateway 호출 ────────────────────────────────────────────────────
interface AiReplyOptions {
  userMessage: string;
  guardianName: string;
  guardianHeadline: string;
  guardianBio: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

async function generateAiReply(opts: AiReplyOptions): Promise<string | null> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;

  if (!apiKey) {
    console.error("[AI reply] AI_GATEWAY_API_KEY not set — using fallback");
    return buildFallbackReply(opts.userMessage, opts.guardianName);
  }
  console.log("[AI reply] key present, calling gateway…");

  const systemPrompt = `당신은 한국 여행 가이드 "${opts.guardianName}"의 AI 어시스턴트입니다.
${opts.guardianHeadline ? `소개: ${opts.guardianHeadline}` : ""}
${opts.guardianBio ? `프로필: ${opts.guardianBio}` : ""}

역할과 규칙:
- 여행자의 문의에 ${opts.guardianName} 가이드를 대신해 친절하고 간결하게 답변합니다.
- 답변은 2–3문장 이내로 짧고 자연스럽게 작성합니다.
- 날짜/금액 확정이 필요한 사항은 "요청하기를 통해 상세 조율이 가능하다"고 안내합니다.
- 확실하지 않은 정보(가격, 정확한 일정 등)는 추측하지 않습니다.
- 한국어로 답변합니다. 이모지를 적절히 사용해 친근한 느낌을 줍니다.
- 메시지 본문에는 "[자동]" 같은 머리말을 넣지 마세요(시스템이 접두사를 붙입니다).`.trim();

  try {
    const res = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        max_tokens: 300,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          ...opts.conversationHistory.slice(-4),
          { role: "user", content: opts.userMessage },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error("[AI reply] Gateway error:", res.status, await res.text());
      return buildFallbackReply(opts.userMessage, opts.guardianName);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.error("[AI reply] Fetch failed:", err);
    return buildFallbackReply(opts.userMessage, opts.guardianName);
  }
}

function buildFallbackReply(userMessage: string, guardianName: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes("동행") || lower.includes("같이"))
    return `안녕하세요! 동행 문의 감사해요 😊 원하시는 날짜와 인원을 알려주시면 ${guardianName}이 빠르게 확인해 드릴게요.`;
  if (lower.includes("일정") || lower.includes("날짜") || lower.includes("언제"))
    return `일정 문의 감사해요! 원하시는 날짜 범위를 알려주시면 확인해 드릴게요 📅`;
  if (lower.includes("가격") || lower.includes("비용") || lower.includes("얼마"))
    return `요금은 일정·인원·코스에 따라 달라져요. '요청하기'로 세부 내용 남겨주시면 맞춤 안내 드릴게요!`;
  if (lower.includes("언어") || lower.includes("영어"))
    return `영어 소통 가능해요! 걱정 마세요 😊`;
  return `문의 감사해요! ${guardianName}이 확인 후 빠르게 답변 드릴게요 🙏`;
}
