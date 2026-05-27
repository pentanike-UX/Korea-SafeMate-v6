"use server";

/**
 * 하루루트 access 관련 서버 액션.
 * 정책: docs/payment-and-share-policy.md
 *
 * Phase 3B: PG 실 결제 검증은 Phase 3C에서 추가. 본 액션들은 결제 콜백이나
 * 운영 자동화에서 호출하는 신뢰 가능한 경계 — 모두 service-role 사용.
 *
 * 클라이언트 fake 결제(`PlaybookUnlockSheet`)는 데모 모드에서만 동작하며,
 * 본 액션 호출 전 서버측 결제 검증을 별도로 거쳐야 한다.
 */

import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { ROUTE_ACCESS_WINDOW_DAYS, ROUTE_SHARE_INVITE_LIMIT } from "@/types/route-access";

function plus90DaysIso(): string {
  return new Date(Date.now() + ROUTE_ACCESS_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function plus12MonthsIso(): string {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
}

/** 단건(990원) 결제 검증 후 본 액션 호출. */
export async function createRouteSingleGrantAction(input: {
  routeId: string;
  ownerUserId: string;
  paymentReceiptId: string;
}): Promise<{ ok: true; grantId: string } | { ok: false; error: string }> {
  // TODO(Phase 3C): paymentReceiptId의 정합성 검증(승인 금액 990, 미사용 영수증 등).
  if (!input.paymentReceiptId) return { ok: false, error: "missing-receipt" };
  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-role-unavailable" };
  const { data, error } = await svc
    .from("route_access_grants")
    .upsert(
      {
        route_id: input.routeId,
        owner_user_id: input.ownerUserId,
        source: "single",
        expires_at: plus90DaysIso(),
      },
      { onConflict: "route_id,owner_user_id" },
    )
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert-failed" };
  return { ok: true, grantId: data.id };
}

/** Trio/Penta 패키지 결제 후 호출. */
export async function createRouteTicketPackAction(input: {
  ownerUserId: string;
  packSize: 3 | 5;
  paymentReceiptId: string;
}): Promise<{ ok: true; packId: string } | { ok: false; error: string }> {
  if (!input.paymentReceiptId) return { ok: false, error: "missing-receipt" };
  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-role-unavailable" };
  const { data, error } = await svc
    .from("route_ticket_packs")
    .insert({
      owner_user_id: input.ownerUserId,
      pack_size: input.packSize,
      tickets_used: 0,
      expires_at: plus12MonthsIso(),
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert-failed" };
  return { ok: true, packId: data.id };
}

/** 잔여 티켓 1장 소모 → 그 루트에 대해 90일 grant 발급. 사용자 컨펌 후 호출. */
export async function consumeRouteTicketAction(input: {
  packId: string;
  routeId: string;
}): Promise<{ ok: true; grantId: string } | { ok: false; error: string }> {
  const viewerId = await getSupabaseAuthUserIdOnly();
  if (!viewerId) return { ok: false, error: "unauthorized" };
  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-role-unavailable" };

  // 소유권 확인 + 잔여 검사 (race-safe하게 update ... returning)
  const { data: pack, error: packErr } = await svc
    .from("route_ticket_packs")
    .select("id, owner_user_id, pack_size, tickets_used, expires_at")
    .eq("id", input.packId)
    .maybeSingle();
  if (packErr || !pack) return { ok: false, error: "pack-not-found" };
  if (pack.owner_user_id !== viewerId) return { ok: false, error: "not-owner" };
  if (new Date(pack.expires_at).getTime() < Date.now()) return { ok: false, error: "pack-expired" };
  if (pack.tickets_used >= pack.pack_size) return { ok: false, error: "tickets-exhausted" };

  // 카운터 증가 — 동시성 안전을 위해 update with check.
  const { data: updated, error: updErr } = await svc
    .from("route_ticket_packs")
    .update({ tickets_used: pack.tickets_used + 1 })
    .eq("id", pack.id)
    .eq("tickets_used", pack.tickets_used)
    .select("id")
    .maybeSingle();
  if (updErr || !updated) return { ok: false, error: "race-conflict" };

  const source: "trio" | "penta" = pack.pack_size === 3 ? "trio" : "penta";
  const { data: grant, error: grantErr } = await svc
    .from("route_access_grants")
    .upsert(
      {
        route_id: input.routeId,
        owner_user_id: viewerId,
        source,
        expires_at: plus90DaysIso(),
      },
      { onConflict: "route_id,owner_user_id" },
    )
    .select("id")
    .single();
  if (grantErr || !grant) return { ok: false, error: grantErr?.message ?? "grant-failed" };
  return { ok: true, grantId: grant.id };
}

/** 오너가 다른 회원에게 무료 초대 발급. grant당 최대 2명. */
export async function createRouteShareInviteAction(input: {
  grantId: string;
  granteeUserId: string;
}): Promise<{ ok: true; inviteId: string } | { ok: false; error: string }> {
  const ownerId = await getSupabaseAuthUserIdOnly();
  if (!ownerId) return { ok: false, error: "unauthorized" };
  if (input.granteeUserId === ownerId) return { ok: false, error: "cannot-invite-self" };
  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-role-unavailable" };

  // 1) grant 소유권 확인
  const { data: grant, error: grantErr } = await svc
    .from("route_access_grants")
    .select("id, owner_user_id, expires_at")
    .eq("id", input.grantId)
    .maybeSingle();
  if (grantErr || !grant) return { ok: false, error: "grant-not-found" };
  if (grant.owner_user_id !== ownerId) return { ok: false, error: "not-owner" };
  if (new Date(grant.expires_at).getTime() < Date.now()) return { ok: false, error: "grant-expired" };

  // 2) 활성 invite 한도 확인 (DB 트리거가 이중 방어하지만 사용자 친화 메시지를 위해 선검사)
  const { data: actives } = await svc
    .from("route_share_invites")
    .select("id")
    .eq("grant_id", input.grantId)
    .eq("status", "active");
  if ((actives?.length ?? 0) >= ROUTE_SHARE_INVITE_LIMIT) {
    return { ok: false, error: "invite-limit" };
  }

  const { data: inserted, error: insErr } = await svc
    .from("route_share_invites")
    .insert({
      grant_id: input.grantId,
      granted_by_user_id: ownerId,
      granted_to_user_id: input.granteeUserId,
      status: "active",
    })
    .select("id")
    .single();
  if (insErr) {
    if (insErr.message.includes("route_share_invite_limit")) return { ok: false, error: "invite-limit" };
    if (insErr.code === "23505") return { ok: false, error: "duplicate-grantee" };
    return { ok: false, error: insErr.message };
  }
  return { ok: true, inviteId: inserted!.id };
}

export async function revokeRouteShareInviteAction(input: {
  inviteId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ownerId = await getSupabaseAuthUserIdOnly();
  if (!ownerId) return { ok: false, error: "unauthorized" };
  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-role-unavailable" };

  const { data: inv } = await svc
    .from("route_share_invites")
    .select("id, granted_by_user_id, status")
    .eq("id", input.inviteId)
    .maybeSingle();
  if (!inv) return { ok: false, error: "not-found" };
  if (inv.granted_by_user_id !== ownerId) return { ok: false, error: "not-owner" };
  if (inv.status !== "active") return { ok: false, error: "already-revoked" };

  const { error } = await svc
    .from("route_share_invites")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", input.inviteId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
