/**
 * GET /api/notifications/unread
 * 현재 사용자에게 도착한 미확인 메시지 카운트.
 * - 실 사용자: Supabase RLS 기반 SELECT
 * - 모의 가디언(mgXX): 서비스롤 RPC `service_count_unread_chat_threads(uuid)` 사용
 *
 * 응답: { messages_unread_total: number, threads_unread_total: number }
 */
import { NextResponse } from "next/server";
import { getSessionUserId, getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { isMockGuardianId, resolveMockGuardianUuid } from "@/lib/dev/mock-guardian-auth";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ messages_unread_total: 0, threads_unread_total: 0 });

  const svc = createServiceRoleSupabase();

  // 모의 가디언: service_role + 실 UUID 매핑으로 RPC 호출
  if (isMockGuardianId(userId)) {
    const realId = resolveMockGuardianUuid(userId);
    if (!realId || !svc) return NextResponse.json({ messages_unread_total: 0, threads_unread_total: 0 });
    const [{ data: cnt }, { count: total }] = await Promise.all([
      svc.rpc("service_count_unread_chat_threads", { p_user_id: realId }),
      svc
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
        .neq("sender_user_id", realId),
    ]);
    return NextResponse.json({
      messages_unread_total: Number(total ?? 0),
      threads_unread_total: Number(cnt ?? 0),
    });
  }

  // 실 사용자: RLS 기반
  const sb = await getServerSupabaseForUser();
  if (!sb) return NextResponse.json({ messages_unread_total: 0, threads_unread_total: 0 });

  const { count, error } = await sb
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false)
    .neq("sender_user_id", userId);

  if (error) {
    console.warn("[GET /api/notifications/unread]", error.message);
    return NextResponse.json({ messages_unread_total: 0, threads_unread_total: 0 });
  }

  // 스레드 단위 미읽음(서비스롤 가용 시): 더 정확한 헤더 배지용
  let threadsUnread = 0;
  if (svc) {
    const { data: t } = await svc.rpc("service_count_unread_chat_threads", { p_user_id: userId });
    threadsUnread = Number(t ?? 0);
  }

  return NextResponse.json({
    messages_unread_total: Number(count ?? 0),
    threads_unread_total: threadsUnread,
  });
}
