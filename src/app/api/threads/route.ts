/**
 * POST /api/threads — pre_booking 스레드 upsert
 * GET  /api/threads — 내 스레드 목록 (enriched: other + source_post + unread + last preview)
 *
 * `guardian_user_id`는 uuid 또는 시드 슬러그 모두 허용 — normalizeGuardianRef.
 * `source_post_id`(선택)는 처음 생성 시에만 저장.
 */
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/supabase/server-user";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { normalizeGuardianRef } from "@/lib/guardian-id-normalize.server";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

// ── POST: 스레드 생성 or 기존 반환 ──────────────────────────────────────────
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { guardian_user_id?: string; source_post_id?: string | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.guardian_user_id) {
    return NextResponse.json({ error: "guardian_user_id required" }, { status: 400 });
  }

  const norm = await normalizeGuardianRef(body.guardian_user_id);
  if (!norm.ok) {
    const status = norm.reason === "invalid" ? 400 : 404;
    const error = norm.reason === "invalid" ? "guardian_user_id invalid" : "guardian_not_found";
    console.warn("[POST /api/threads] normalize fail", { input: body.guardian_user_id, reason: norm.reason });
    return NextResponse.json({ error }, { status });
  }
  const guardianUuid = norm.uuid;

  if (guardianUuid === userId) {
    return NextResponse.json({ error: "Cannot start thread with yourself" }, { status: 400 });
  }

  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  // 기존 pre_booking 스레드
  const { data: existing } = await sb
    .from("message_threads")
    .select("*")
    .eq("traveler_user_id", userId)
    .eq("guardian_user_id", guardianUuid)
    .eq("inquiry_kind", "pre_booking")
    .maybeSingle();

  if (existing) {
    // 기존 스레드에 source_post_id 가 비어 있고 새 입력이 있으면 한 번만 보강
    const incomingPostId = typeof body.source_post_id === "string" ? body.source_post_id.trim() : "";
    if (!existing.source_post_id && incomingPostId) {
      void sb.from("message_threads").update({ source_post_id: incomingPostId }).eq("id", existing.id);
    }
    return NextResponse.json({ thread: existing, created: false });
  }

  // 신규 생성
  const insertRow: Record<string, unknown> = {
    traveler_user_id: userId,
    guardian_user_id: guardianUuid,
    inquiry_kind: "pre_booking",
  };
  const incomingPostId = typeof body.source_post_id === "string" ? body.source_post_id.trim() : "";
  if (incomingPostId) insertRow.source_post_id = incomingPostId;

  const { data: created, error } = await sb
    .from("message_threads")
    .insert(insertRow)
    .select()
    .single();

  if (error) {
    console.error("[POST /api/threads] insert fail", { source: norm.source, message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ thread: created, created: true }, { status: 201 });
}

// ── GET: enriched thread list ───────────────────────────────────────────────
type ThreadRow = {
  id: string;
  traveler_user_id: string;
  guardian_user_id: string;
  inquiry_kind: string;
  last_message_at: string | null;
  source_post_id: string | null;
  created_at: string;
};

type LastMessageRow = {
  thread_id: string;
  content: string;
  sender_role: "traveler" | "guardian" | "admin";
  is_ai_reply: boolean;
  created_at: string;
};

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  // RLS — 본인이 참여한 스레드만
  const { data: rawThreads, error } = await sb
    .from("message_threads")
    .select("id, traveler_user_id, guardian_user_id, inquiry_kind, last_message_at, source_post_id, created_at")
    .or(`traveler_user_id.eq.${userId},guardian_user_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const threads = (rawThreads ?? []) as ThreadRow[];
  if (threads.length === 0) return NextResponse.json({ threads: [] });

  // 상대 user_id 모음
  const otherIds = [...new Set(threads.map((t) => (t.traveler_user_id === userId ? t.guardian_user_id : t.traveler_user_id)))];
  const postIds = [...new Set(threads.map((t) => t.source_post_id).filter((x): x is string => !!x))];
  const threadIds = threads.map((t) => t.id);

  // service role로 user_profiles + guardian_profiles + content_posts 조회 (RLS는 본인 스레드만 통과한 상태)
  const svc = createServiceRoleSupabase();

  const [userProfRes, guardianProfRes, postsRes, lastMsgRes, unreadRes] = await Promise.all([
    svc
      ? svc.from("user_profiles").select("user_id, display_name, profile_image_url").in("user_id", otherIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; display_name: string | null; profile_image_url: string | null }> } as const),
    svc
      ? svc.from("guardian_profiles").select("user_id, display_name, avatar_image_url, last_seen_at").in("user_id", otherIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; display_name: string | null; avatar_image_url: string | null; last_seen_at: string | null }> } as const),
    svc && postIds.length > 0
      ? svc.from("content_posts").select("id, title, cover_image_url").in("id", postIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string; cover_image_url: string | null }> } as const),
    // 마지막 메시지 1건씩
    sb
      .from("messages")
      .select("thread_id, content, sender_role, is_ai_reply, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false })
      .limit(threadIds.length * 5),
    // 나에게 도착한 미확인 메시지 (sender != me, is_read = false)
    sb
      .from("messages")
      .select("thread_id")
      .in("thread_id", threadIds)
      .eq("is_read", false)
      .neq("sender_user_id", userId),
  ]);

  const userProfMap = new Map<string, { display_name: string | null; profile_image_url: string | null }>();
  for (const r of (userProfRes.data ?? []) as Array<{ user_id: string; display_name: string | null; profile_image_url: string | null }>) {
    userProfMap.set(r.user_id, { display_name: r.display_name, profile_image_url: r.profile_image_url });
  }

  const guardianProfMap = new Map<string, { display_name: string | null; avatar_image_url: string | null; last_seen_at: string | null }>();
  for (const r of (guardianProfRes.data ?? []) as Array<{ user_id: string; display_name: string | null; avatar_image_url: string | null; last_seen_at: string | null }>) {
    guardianProfMap.set(r.user_id, { display_name: r.display_name, avatar_image_url: r.avatar_image_url, last_seen_at: r.last_seen_at });
  }

  const postMap = new Map<string, { id: string; title: string; cover_image_url: string | null }>();
  for (const r of (postsRes.data ?? []) as Array<{ id: string; title: string; cover_image_url: string | null }>) {
    postMap.set(r.id, r);
  }

  const lastByThread = new Map<string, LastMessageRow>();
  for (const m of ((lastMsgRes.data ?? []) as LastMessageRow[])) {
    if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m);
  }

  const unreadByThread = new Map<string, number>();
  for (const m of ((unreadRes.data ?? []) as Array<{ thread_id: string }>)) {
    unreadByThread.set(m.thread_id, (unreadByThread.get(m.thread_id) ?? 0) + 1);
  }

  const enriched = threads.map((t) => {
    const otherUserId = t.traveler_user_id === userId ? t.guardian_user_id : t.traveler_user_id;
    const otherRole: "traveler" | "guardian" = t.traveler_user_id === userId ? "guardian" : "traveler";
    const gp = guardianProfMap.get(otherUserId);
    const up = userProfMap.get(otherUserId);
    const displayName =
      (otherRole === "guardian" ? gp?.display_name : up?.display_name) ||
      gp?.display_name ||
      up?.display_name ||
      (otherRole === "guardian" ? "하루이" : "여행자");
    const avatarUrl = otherRole === "guardian" ? gp?.avatar_image_url ?? null : up?.profile_image_url ?? null;
    const lastMsg = lastByThread.get(t.id) ?? null;
    const previewText = lastMsg?.content ? (lastMsg.content.length > 80 ? lastMsg.content.slice(0, 80) + "…" : lastMsg.content) : null;
    const sp = t.source_post_id ? postMap.get(t.source_post_id) ?? null : null;

    return {
      id: t.id,
      traveler_user_id: t.traveler_user_id,
      guardian_user_id: t.guardian_user_id,
      inquiry_kind: t.inquiry_kind,
      last_message_at: t.last_message_at,
      source_post_id: t.source_post_id,
      created_at: t.created_at,
      unread_count: unreadByThread.get(t.id) ?? 0,
      source_post: sp,
      other: {
        user_id: otherUserId,
        display_name: displayName,
        avatar_url: avatarUrl,
        role: otherRole,
        ...(otherRole === "guardian" ? { last_seen_at: gp?.last_seen_at ?? null } : {}),
      },
      last_message_preview: previewText,
      last_message_role: lastMsg?.sender_role ?? null,
      last_message_is_ai: lastMsg?.is_ai_reply ?? false,
    };
  });

  return NextResponse.json({ threads: enriched });
}
