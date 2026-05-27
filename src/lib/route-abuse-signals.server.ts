/**
 * route_abuse_signals — 어뷰징 감시 이벤트 기록.
 * 정책: docs/payment-and-share-policy.md §3.5
 *
 * 모든 INSERT는 service-role 경유.
 * 호출자: 액션 함수들이 의심스러운 패턴 감지 시 호출.
 */
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export type AbuseSignalType =
  | "invite-cycle-warn"
  | "invite-rapid-warn"
  | "invite-self-attempt"
  | "share-link-anon-attempt"
  | "comp-issued"
  | "grant-expired-manual";

export type AbuseSeverity = "info" | "warn" | "critical";

export async function logAbuseSignal(input: {
  signalType: AbuseSignalType;
  severity?: AbuseSeverity;
  grantId?: string | null;
  actorUserId?: string | null;
  targetUserId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const svc = createServiceRoleSupabase();
  if (!svc) return;
  await svc.from("route_abuse_signals").insert({
    signal_type: input.signalType,
    severity: input.severity ?? "info",
    grant_id: input.grantId ?? null,
    actor_user_id: input.actorUserId ?? null,
    target_user_id: input.targetUserId ?? null,
    payload: input.payload ?? {},
  });
}

/**
 * 같은 grant에서 최근 1시간 내 발급된 active invite 개수.
 * 정상이라면 1~2건이지만, 비정상적인 빠른 회전(예: 즉시 invite → revoke → re-invite)을
 * 검출하기 위해 추가 신호를 남긴다.
 */
export async function countRecentInviteEventsForGrant(grantId: string, windowMs: number): Promise<number> {
  const svc = createServiceRoleSupabase();
  if (!svc) return 0;
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count } = await svc
    .from("route_share_invites")
    .select("id", { count: "exact", head: true })
    .eq("grant_id", grantId)
    .gte("created_at", since);
  return count ?? 0;
}
