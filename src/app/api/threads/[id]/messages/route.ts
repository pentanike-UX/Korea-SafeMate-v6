/**
 * GET  /api/threads/[id]/messages — 메시지 목록 (최신 100건)
 * POST /api/threads/[id]/messages — 메시지 전송 + AI 자동답변 트리거
 */
import { NextResponse } from "next/server";
import { getSessionUserId, getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { sendInboundMessagePush } from "@/lib/push-server";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

type Params = { params: Promise<{ id: string }> };

function body_content_preview(s: string): string {
  const t = (s ?? "").trim();
  return t.length > 100 ? t.slice(0, 100) + "…" : t;
}

// ── GET: 메시지 조회 ──────────────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  const { id: threadId } = await params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

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

  // 상대방 메시지 읽음 처리 (fire-and-forget)
  void sb
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

  let body: { content: string; content_type?: "text" | "image" | "route_preview"; client_msg_id?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }
  const clientMsgId = typeof body.client_msg_id === "string" && body.client_msg_id.trim() ? body.client_msg_id.trim() : null;

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

  // 멱등성: client_msg_id 가 있고 이미 동일 (thread_id, client_msg_id) 행이 있으면 그 행 반환
  if (clientMsgId) {
    const { data: dup } = await sb
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .eq("client_msg_id", clientMsgId)
      .maybeSingle();
    if (dup) {
      return NextResponse.json({ message: dup, deduped: true }, { status: 200 });
    }
  }

  // 메시지 삽입
  const insertRow: Record<string, unknown> = {
    thread_id: threadId,
    sender_user_id: userId,
    sender_role: senderRole,
    content: body.content.trim(),
    content_type: body.content_type ?? "text",
  };
  if (clientMsgId) insertRow.client_msg_id = clientMsgId;

  const { data: message, error: msgErr } = await sb
    .from("messages")
    .insert(insertRow)
    .select()
    .single();

  if (msgErr) {
    // 23505 unique violation → 동시성 race; 기존 행 반환
    if (msgErr.code === "23505" && clientMsgId) {
      const { data: existing } = await sb
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .eq("client_msg_id", clientMsgId)
        .maybeSingle();
      if (existing) return NextResponse.json({ message: existing, deduped: true }, { status: 200 });
    }
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  // last_message_at 갱신
  void sb
    .from("message_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", threadId);

  // ── 푸시 알림 (수신자에게) ────────────────────────────────────────────────
  void (async () => {
    const otherUserId = isTraveler ? thread.guardian_user_id : thread.traveler_user_id;
    if (!otherUserId) return;
    const svc = createServiceRoleSupabase();
    let displayName = "새 메시지";
    let postTitle: string | null = null;
    if (svc) {
      const [{ data: prof }, { data: th }] = await Promise.all([
        svc.from("user_profiles").select("display_name").eq("user_id", userId).maybeSingle(),
        svc.from("message_threads").select("source_post_id").eq("id", threadId).maybeSingle(),
      ]);
      if (prof?.display_name) displayName = prof.display_name as string;
      if (th?.source_post_id) {
        const { data: post } = await svc.from("content_posts").select("title").eq("id", th.source_post_id).maybeSingle();
        if (post?.title) postTitle = post.title as string;
      }
    }
    const inboxHref = isTraveler ? "/mypage/guardian/messages" : "/mypage/messages";
    const title = `${displayName}님으로부터 새 메시지`;
    const body = postTitle ? `📍 ${postTitle}\n${body_content_preview(message.content)}` : body_content_preview(message.content);
    await sendInboundMessagePush(otherUserId, { title, body, href: inboxHref, tag: `thread:${threadId}` });
  })();

  // ── AI 자동답변 (여행자 메시지 + AI 설정 ON인 경우) ───────────────────────
  if (isTraveler) {
    // AI 트리거는 응답 반환 후 비동기로 처리 (waitUntil 없으면 best-effort)
    void triggerAiReply(sb, threadId, thread.guardian_user_id, body.content.trim());
  }

  return NextResponse.json({ message }, { status: 201 });
}

// ── AI 자동답변 트리거 (비동기) ──────────────────────────────────────────────
async function triggerAiReply(
  sb: Awaited<ReturnType<typeof getServerSupabaseForUser>>,
  threadId: string,
  guardianUserId: string,
  userMessage: string,
) {
  if (!sb) return;

  const { data: guardianProfile } = await sb
    .from("guardian_profiles")
    .select("ai_auto_reply_enabled, display_name, headline, bio")
    .eq("user_id", guardianUserId)
    .maybeSingle();

  if (!guardianProfile?.ai_auto_reply_enabled) return;

  // 최근 5개 메시지를 컨텍스트로 제공 (자연스러운 대화 흐름 유지)
  const { data: recentMessages } = await sb
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

  await sb.from("messages").insert({
    thread_id: threadId,
    sender_user_id: guardianUserId,
    sender_role: "guardian",
    content: aiContent,
    content_type: "text",
    is_ai_reply: true,
  });

  void sb
    .from("message_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", threadId);
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

  // API 키가 없으면 fallback 응답 반환
  if (!apiKey) {
    return buildFallbackReply(opts.userMessage, opts.guardianName);
  }

  const systemPrompt = `당신은 한국 여행 가이드 "${opts.guardianName}"의 AI 어시스턴트입니다.
${opts.guardianHeadline ? `소개: ${opts.guardianHeadline}` : ""}
${opts.guardianBio ? `프로필: ${opts.guardianBio}` : ""}

역할과 규칙:
- 여행자의 문의에 ${opts.guardianName} 가이드를 대신해 친절하고 간결하게 답변합니다.
- 답변은 2–3문장 이내로 짧고 자연스럽게 작성합니다.
- 날짜/금액 확정이 필요한 사항은 "요청하기를 통해 상세 조율이 가능하다"고 안내합니다.
- 확실하지 않은 정보(가격, 정확한 일정 등)는 추측하지 않습니다.
- 한국어로 답변합니다. 이모지를 적절히 사용해 친근한 느낌을 줍니다.
- AI 어시스턴트임을 밝히지 않습니다.`.trim();

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
          ...opts.conversationHistory.slice(-4), // 최근 4턴 컨텍스트
          { role: "user", content: opts.userMessage },
        ],
      }),
      signal: AbortSignal.timeout(8000), // 8초 타임아웃
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

// ── API 키 미설정 / 오류 시 fallback ─────────────────────────────────────────
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
