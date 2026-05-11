/**
 * POST /api/threads — pre_booking 스레드 upsert (여행자가 가디언에게 첫 문의)
 * GET  /api/threads — 현재 로그인 사용자의 스레드 목록
 */
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/supabase/server-user";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

// ── POST: 스레드 생성 or 기존 반환 ──────────────────────────────────────────
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { guardian_user_id: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.guardian_user_id) {
    return NextResponse.json({ error: "guardian_user_id required" }, { status: 400 });
  }
  if (body.guardian_user_id === userId) {
    return NextResponse.json({ error: "Cannot start thread with yourself" }, { status: 400 });
  }

  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  // 기존 pre_booking 스레드 확인 (unique 인덱스 기반)
  const { data: existing } = await sb
    .from("message_threads")
    .select("*")
    .eq("traveler_user_id", userId)
    .eq("guardian_user_id", body.guardian_user_id)
    .eq("inquiry_kind", "pre_booking")
    .maybeSingle();

  if (existing) return NextResponse.json({ thread: existing, created: false });

  // 신규 생성
  const { data: created, error } = await sb
    .from("message_threads")
    .insert({
      traveler_user_id: userId,
      guardian_user_id: body.guardian_user_id,
      inquiry_kind: "pre_booking",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ thread: created, created: true }, { status: 201 });
}

// ── GET: 내 스레드 목록 ──────────────────────────────────────────────────────
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { data: threads, error } = await sb
    .from("message_threads")
    .select("*")
    .or(`traveler_user_id.eq.${userId},guardian_user_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ threads: threads ?? [] });
}
