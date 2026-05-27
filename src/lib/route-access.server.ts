/**
 * 서버측 하루루트 access resolver.
 * 정책: docs/payment-and-share-policy.md
 *
 * - DB(route_access_grants / route_ticket_packs / route_share_invites) 조회
 *   기반의 신뢰 가능한 판정. 클라이언트의 mock resolver(`route-access-mock.ts`)와
 *   동일한 의미를 갖는다.
 */
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import type { RouteAccessDecision } from "@/types/route-access";

/**
 * 사용자별 루트 access 판정. 비로그인이면 즉시 'anonymous'.
 *
 * 우선순위:
 *  1) 본인 grant 미만료 (owner)
 *  2) 공유받은 invite 활성 (shared-invite) — sharedBy 정보 포함
 *  3) 잔여 티켓 보유 (ticket-prompt) — 클라이언트에서 컨펌 다이얼로그 노출
 *  4) 패키지 보유했으나 소진 (tickets-exhausted)
 *  5) 그 외 (no-access)
 */
export async function resolveRouteAccessServer({
  routeId,
  userId,
}: {
  routeId: string;
  userId: string | null;
}): Promise<RouteAccessDecision> {
  if (!userId) return { canView: false, reason: "anonymous" };

  // user-scoped client로 본인 grant/invite를 RLS 통과해 조회.
  const sb = await getServerSupabaseForUser();
  if (!sb) return { canView: false, reason: "no-access" };

  // 1·2) 하나의 SQL로 owner / shared-invite 판정 (route_access_resolve RPC).
  const { data: resolved, error: resolvedErr } = await sb.rpc("route_access_resolve", {
    p_route_id: routeId,
    p_viewer: userId,
  });
  if (!resolvedErr && Array.isArray(resolved) && resolved.length > 0) {
    const r = resolved[0] as {
      can_view: boolean;
      reason: string;
      expires_at: string;
      shared_by_user_id: string | null;
      grant_id: string;
    };
    if (r.can_view) {
      const sharedBy = r.shared_by_user_id
        ? await fetchOwnerProfile(r.shared_by_user_id)
        : null;
      return {
        canView: true,
        reason: r.reason === "shared-invite" ? "shared-invite" : "owner",
        expires_at: r.expires_at,
        sharedBy,
      };
    }
  }

  // 3·4) 잔여 티켓 — packs에서 tickets_used < pack_size 합산.
  const { data: packs } = await sb
    .from("route_ticket_packs")
    .select("id, pack_size, tickets_used, expires_at")
    .eq("owner_user_id", userId)
    .gt("expires_at", new Date().toISOString());

  if (Array.isArray(packs) && packs.length > 0) {
    const remaining = packs.reduce(
      (sum: number, p: { pack_size: number; tickets_used: number }) =>
        sum + Math.max(0, p.pack_size - p.tickets_used),
      0,
    );
    if (remaining > 0) {
      const usablePack = packs.find(
        (p: { pack_size: number; tickets_used: number }) => p.tickets_used < p.pack_size,
      );
      return {
        canView: false,
        reason: "ticket-prompt",
        ticketsRemaining: remaining,
        ticketPackId: usablePack?.id ?? null,
      };
    }
    return { canView: false, reason: "tickets-exhausted" };
  }

  return { canView: false, reason: "no-access" };
}

async function fetchOwnerProfile(userId: string): Promise<{
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
} | null> {
  // 공개 노출용 — service-role로 minimal 필드만 조회.
  const svc = createServiceRoleSupabase();
  if (!svc) return { user_id: userId, display_name: userId };
  const { data } = await svc
    .from("guardian_profiles")
    .select("display_name, photo_url, avatar_image_url")
    .eq("user_id", userId)
    .maybeSingle();
  const row = (data ?? null) as {
    display_name?: string | null;
    photo_url?: string | null;
    avatar_image_url?: string | null;
  } | null;
  return {
    user_id: userId,
    display_name: row?.display_name?.trim() || "Member",
    avatar_url: row?.photo_url ?? row?.avatar_image_url ?? null,
  };
}
