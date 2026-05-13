/**
 * POST /api/threads — pre_booking 스레드 upsert (여행자가 가디언에게 첫 문의)
 * GET  /api/threads — 현재 로그인 사용자의 스레드 목록 (미리보기·미읽음 포함)
 */
import { NextResponse } from "next/server";
import { fetchMessageThreadListRowsForParticipant } from "@/lib/chat/thread-list-service-fallback";
import {
  isMockGuardianId,
  resolveMockGuardianUuid,
  sessionUserIdToDbParticipantId,
} from "@/lib/dev/mock-guardian-auth";
import { isUuidString } from "@/lib/guardian-posts-api";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { getSessionUserId, getServerSupabaseForUser } from "@/lib/supabase/server-user";
import type { MessageThreadListRow } from "@/types/domain";

type PostBody = {
  guardian_user_id: string;
  content_post_id?: string | null;
};

async function validateContentPostForGuardian(
  sb: NonNullable<Awaited<ReturnType<typeof getServerSupabaseForUser>>>,
  contentPostId: string,
  guardianUserId: string,
): Promise<string | null> {
  const { data: post, error } = await sb
    .from("content_posts")
    .select("id, author_user_id")
    .eq("id", contentPostId)
    .maybeSingle();
  if (error) return error.message;
  if (!post) return "content_post not found";
  if (post.author_user_id !== guardianUserId) return "content_post does not match guardian";
  return null;
}

// ── POST: 스레드 생성 or 기존 반환 ──────────────────────────────────────────
export async function POST(req: Request) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // mock guardian 세션 ID(mgXX)는 실제 Supabase auth UUID로 변환해야 한다.
  // (그렇지 않으면 PostgreSQL UUID 타입 컬럼에서 "invalid input syntax for type uuid" 에러)
  if (isMockGuardianId(sessionUserId) && !resolveMockGuardianUuid(sessionUserId)) {
    return NextResponse.json({ error: "invalid_mock_session" }, { status: 400 });
  }
  const userId = sessionUserIdToDbParticipantId(sessionUserId);

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.guardian_user_id) {
    return NextResponse.json({ error: "guardian_user_id required" }, { status: 400 });
  }
  if (body.guardian_user_id === userId) {
    return NextResponse.json({ error: "Cannot start thread with yourself" }, { status: 400 });
  }

  let contentPostId: string | null = null;
  if (body.content_post_id != null && String(body.content_post_id).trim() !== "") {
    const raw = String(body.content_post_id).trim();
    if (isUuidString(raw)) {
      contentPostId = raw;
    } else {
      // 시드·데모 포스트 ID(`seed-…` 등)는 DB FK에 없을 수 있음 — 문의 스레드 생성은 막지 않음
      console.warn("[threads POST] ignoring non-uuid content_post_id:", raw.slice(0, 80));
    }
  }

  // mock guardian 세션은 Supabase 인증이 없으므로 RLS 우회용 service role 사용
  const isMockSession = isMockGuardianId(sessionUserId);
  const sb = isMockSession ? createServiceRoleSupabase() : await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  if (contentPostId) {
    const err = await validateContentPostForGuardian(sb, contentPostId, body.guardian_user_id);
    if (err) {
      console.warn("[threads POST] dropping content_post_id after validation:", err);
      contentPostId = null;
    }
  }

  // 기존 pre_booking 스레드 확인 (unique 인덱스 기반)
  const { data: existing } = await sb
    .from("message_threads")
    .select("*")
    .eq("traveler_user_id", userId)
    .eq("guardian_user_id", body.guardian_user_id)
    .eq("inquiry_kind", "pre_booking")
    .maybeSingle();

  if (existing) {
    if (contentPostId) {
      const { error: upErr } = await sb
        .from("message_threads")
        .update({ content_post_id: contentPostId })
        .eq("id", existing.id);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      const { data: refreshed } = await sb.from("message_threads").select("*").eq("id", existing.id).maybeSingle();
      return NextResponse.json({ thread: refreshed ?? { ...existing, content_post_id: contentPostId }, created: false });
    }
    return NextResponse.json({ thread: existing, created: false });
  }

  // 신규 생성
  const { data: created, error } = await sb
    .from("message_threads")
    .insert({
      traveler_user_id: userId,
      guardian_user_id: body.guardian_user_id,
      inquiry_kind: "pre_booking",
      content_post_id: contentPostId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ thread: created, created: true }, { status: 201 });
}

// ── GET: 내 스레드 목록 (메시지 1건 이상만, 미리보기·미읽음) ─────────────────
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceRoleSupabase();

  if (isMockGuardianId(userId)) {
    const realId = resolveMockGuardianUuid(userId);
    if (!realId) {
      return NextResponse.json({ error: "invalid_mock_session" }, { status: 400 });
    }
    if (!svc) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
    const { data, error } = await svc.rpc("service_message_threads_list_for_user", {
      p_user_id: realId,
    });
    if (!error) {
      return NextResponse.json({ threads: (data ?? []) as MessageThreadListRow[] });
    }
    console.warn("[threads GET] service_message_threads_list_for_user failed, using fallback:", error.message);
    const threads = await fetchMessageThreadListRowsForParticipant(svc, realId);
    return NextResponse.json({ threads });
  }

  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { data, error } = await sb.rpc("message_threads_list_for_viewer");
  if (!error) {
    return NextResponse.json({ threads: (data ?? []) as MessageThreadListRow[] });
  }
  console.warn("[threads GET] message_threads_list_for_viewer failed, using fallback:", error.message);
  if (!svc) {
    return NextResponse.json(
      { error: "thread_list_unavailable", detail: "스레드 목록 RPC를 사용할 수 없습니다. DB 마이그레이션을 확인하세요." },
      { status: 503 },
    );
  }
  const threads = await fetchMessageThreadListRowsForParticipant(svc, userId);
  return NextResponse.json({ threads });
}
