/**
 * GET /api/notifications/unread
 * 현재 사용자에게 도착한 미확인 메시지 총합 (헤더/네비 배지용).
 * - is_read = false AND sender_user_id != me
 * - RLS: messages_participants 정책이 자동 제한
 */
import { NextResponse } from "next/server";
import { getSessionUserId, getServerSupabaseForUser } from "@/lib/supabase/server-user";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ messages_unread_total: 0 });

  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ messages_unread_total: 0 });

  const { count, error } = await sb
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false)
    .neq("sender_user_id", userId);

  if (error) {
    console.error("[GET /api/notifications/unread]", error.message);
    return NextResponse.json({ messages_unread_total: 0 });
  }

  return NextResponse.json({ messages_unread_total: count ?? 0 });
}
