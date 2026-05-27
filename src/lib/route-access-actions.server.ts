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
import { countRecentInviteEventsForGrant, logAbuseSignal } from "@/lib/route-abuse-signals.server";

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
  if (input.granteeUserId === ownerId) {
    await logAbuseSignal({
      signalType: "invite-self-attempt",
      severity: "warn",
      grantId: input.grantId,
      actorUserId: ownerId,
    });
    return { ok: false, error: "cannot-invite-self" };
  }
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
    if (insErr.message.includes("route_share_invite_revoke_cycle")) {
      await logAbuseSignal({
        signalType: "invite-cycle-warn",
        severity: "critical",
        grantId: input.grantId,
        actorUserId: ownerId,
        payload: { reason: "revoke-cycle-threshold" },
      });
      return { ok: false, error: "invite-cycle-limit" };
    }
    if (insErr.code === "23505") return { ok: false, error: "duplicate-grantee" };
    return { ok: false, error: insErr.message };
  }
  // 빈도 검사 — 1시간 내 3건 이상이면 경고 신호.
  const recent = await countRecentInviteEventsForGrant(input.grantId, 60 * 60 * 1000);
  if (recent >= 3) {
    await logAbuseSignal({
      signalType: "invite-rapid-warn",
      severity: "warn",
      grantId: input.grantId,
      actorUserId: ownerId,
      payload: { recent_invites_1h: recent },
    });
  }
  return { ok: true, inviteId: inserted!.id };
}

/**
 * 오너용 — 본인 grant의 활성 초대 목록 + grantee 프로필.
 *
 * Phase 3N: granted_to_user_id가 NULL인 row(=토큰 발급 후 redeem 대기)도 포함.
 * 그 경우 user_id/display_name은 null/"pending"으로 표시되고 invite_token이 채워진다.
 */
export async function listRouteShareInvitesAction(input: {
  grantId: string;
}): Promise<{
  ok: true;
  invites: Array<{
    invite_id: string;
    user_id: string | null;
    display_name: string;
    avatar_url?: string | null;
    invite_token?: string | null;
    pending: boolean;
  }>;
} | { ok: false; error: string }> {
  const ownerId = await getSupabaseAuthUserIdOnly();
  if (!ownerId) return { ok: false, error: "unauthorized" };
  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-role-unavailable" };
  const { data: grant } = await svc
    .from("route_access_grants")
    .select("id, owner_user_id")
    .eq("id", input.grantId)
    .maybeSingle();
  if (!grant || grant.owner_user_id !== ownerId) return { ok: false, error: "not-owner" };
  const { data: rows } = await svc
    .from("route_share_invites")
    .select("id, granted_to_user_id, invite_token, created_at")
    .eq("grant_id", input.grantId)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  const rowsArr = (rows ?? []) as Array<{
    id: string;
    granted_to_user_id: string | null;
    invite_token: string | null;
  }>;
  const userIds = rowsArr
    .map((r) => r.granted_to_user_id)
    .filter((v): v is string => Boolean(v));
  const profileMap = new Map<string, { display_name: string; avatar_url: string | null }>();
  if (userIds.length > 0) {
    const [{ data: gProfiles }, { data: uProfiles }] = await Promise.all([
      svc
        .from("guardian_profiles")
        .select("user_id, display_name, photo_url, avatar_image_url")
        .in("user_id", userIds),
      svc
        .from("user_profiles")
        .select("user_id, display_name, profile_image_url")
        .in("user_id", userIds),
    ]);
    for (const p of (gProfiles ?? []) as Array<{
      user_id: string;
      display_name?: string | null;
      photo_url?: string | null;
      avatar_image_url?: string | null;
    }>) {
      profileMap.set(p.user_id, {
        display_name: p.display_name?.trim() || "Member",
        avatar_url: p.photo_url ?? p.avatar_image_url ?? null,
      });
    }
    for (const p of (uProfiles ?? []) as Array<{
      user_id: string;
      display_name?: string | null;
      profile_image_url?: string | null;
    }>) {
      if (profileMap.has(p.user_id)) continue;
      profileMap.set(p.user_id, {
        display_name: p.display_name?.trim() || "Member",
        avatar_url: p.profile_image_url ?? null,
      });
    }
  }
  const invites = rowsArr.map((r) => {
    if (!r.granted_to_user_id) {
      return {
        invite_id: r.id,
        user_id: null,
        display_name: "pending",
        avatar_url: null,
        invite_token: r.invite_token,
        pending: true,
      };
    }
    const prof = profileMap.get(r.granted_to_user_id);
    return {
      invite_id: r.id,
      user_id: r.granted_to_user_id,
      display_name: prof?.display_name ?? "Member",
      avatar_url: prof?.avatar_url ?? null,
      invite_token: r.invite_token,
      pending: false,
    };
  });
  return { ok: true, invites };
}

/**
 * 멤버 검색 — display_name 부분 일치, 최대 8명. 본인 제외.
 * 검색 풀: guardian_profiles UNION user_profiles — 가디언/일반회원 모두 무료 초대 대상.
 * 두 테이블에 같은 user_id가 있으면 guardian_profiles 쪽을 우선(avatar·display_name 풍부).
 */
export async function searchMembersForInviteAction(input: {
  query: string;
}): Promise<{
  ok: true;
  results: Array<{
    user_id: string;
    display_name: string;
    avatar_url?: string | null;
  }>;
} | { ok: false; error: string }> {
  const ownerId = await getSupabaseAuthUserIdOnly();
  if (!ownerId) return { ok: false, error: "unauthorized" };
  const q = input.query.trim();
  if (q.length < 2) return { ok: true, results: [] };
  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-role-unavailable" };

  const [{ data: gRows, error: gErr }, { data: uRows, error: uErr }] = await Promise.all([
    svc
      .from("guardian_profiles")
      .select("user_id, display_name, photo_url, avatar_image_url")
      .ilike("display_name", `%${q}%`)
      .neq("user_id", ownerId)
      .limit(8),
    svc
      .from("user_profiles")
      .select("user_id, display_name, profile_image_url")
      .ilike("display_name", `%${q}%`)
      .neq("user_id", ownerId)
      .limit(8),
  ]);
  if (gErr) return { ok: false, error: gErr.message };
  if (uErr) return { ok: false, error: uErr.message };

  const map = new Map<
    string,
    { user_id: string; display_name: string; avatar_url: string | null; rank: number }
  >();
  // 1차: guardian_profiles (avatar 풍부, 신뢰도 ↑)
  for (const r of (gRows ?? []) as Array<{
    user_id: string;
    display_name?: string | null;
    photo_url?: string | null;
    avatar_image_url?: string | null;
  }>) {
    map.set(r.user_id, {
      user_id: r.user_id,
      display_name: r.display_name?.trim() || "Member",
      avatar_url: r.photo_url ?? r.avatar_image_url ?? null,
      rank: 0,
    });
  }
  // 2차: user_profiles에 있고 guardian_profiles엔 없는 사람만 추가.
  for (const r of (uRows ?? []) as Array<{
    user_id: string;
    display_name?: string | null;
    profile_image_url?: string | null;
  }>) {
    if (map.has(r.user_id)) continue;
    map.set(r.user_id, {
      user_id: r.user_id,
      display_name: r.display_name?.trim() || "Member",
      avatar_url: r.profile_image_url ?? null,
      rank: 1,
    });
  }
  const merged = [...map.values()]
    .sort((a, b) => a.rank - b.rank || a.display_name.localeCompare(b.display_name))
    .slice(0, 8)
    .map(({ user_id, display_name, avatar_url }) => ({ user_id, display_name, avatar_url }));
  return { ok: true, results: merged };
}

/**
 * Phase 3N — 토큰 링크 발급. grantId로 token이 박힌 invite row 생성.
 * granted_to_user_id는 NULL로 시작 → 누군가 redeem 시 그 사용자 ID로 채워짐.
 *
 * 활성 invite 한도(grant당 2개)는 token 발급도 카운트. 사용자가 의도적으로
 * 다중 토큰 발급 시 트리거가 막아주고 application도 같은 에러 코드 반환.
 *
 * 토큰은 22자 base64url (≈ 128bit 엔트로피) — URL 친화적, 추측 비용 충분.
 */
export async function createRouteInviteLinkAction(input: {
  grantId: string;
}): Promise<{ ok: true; inviteId: string; token: string } | { ok: false; error: string }> {
  const ownerId = await getSupabaseAuthUserIdOnly();
  if (!ownerId) return { ok: false, error: "unauthorized" };
  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-role-unavailable" };

  const { data: grant, error: grantErr } = await svc
    .from("route_access_grants")
    .select("id, owner_user_id, expires_at")
    .eq("id", input.grantId)
    .maybeSingle();
  if (grantErr || !grant) return { ok: false, error: "grant-not-found" };
  if (grant.owner_user_id !== ownerId) return { ok: false, error: "not-owner" };
  if (new Date(grant.expires_at).getTime() < Date.now()) return { ok: false, error: "grant-expired" };

  const { data: actives } = await svc
    .from("route_share_invites")
    .select("id")
    .eq("grant_id", input.grantId)
    .eq("status", "active");
  if ((actives?.length ?? 0) >= ROUTE_SHARE_INVITE_LIMIT) {
    return { ok: false, error: "invite-limit" };
  }

  const token = generateInviteToken();
  const { data: inserted, error: insErr } = await svc
    .from("route_share_invites")
    .insert({
      grant_id: input.grantId,
      granted_by_user_id: ownerId,
      granted_to_user_id: null,
      invite_token: token,
      status: "active",
    })
    .select("id")
    .single();
  if (insErr) {
    if (insErr.message.includes("route_share_invite_limit")) return { ok: false, error: "invite-limit" };
    return { ok: false, error: insErr.message };
  }

  const recent = await countRecentInviteEventsForGrant(input.grantId, 60 * 60 * 1000);
  if (recent >= 3) {
    await logAbuseSignal({
      signalType: "invite-rapid-warn",
      severity: "warn",
      grantId: input.grantId,
      actorUserId: ownerId,
      payload: { recent_invites_1h: recent, kind: "link" },
    });
  }

  return { ok: true, inviteId: inserted!.id, token };
}

/**
 * Phase 3N — 토큰을 가진 사용자가 routeId로 진입할 때 호출.
 * 자신을 granted_to_user_id로 매핑하고 redeemed_at 채움.
 *
 * 케이스:
 *  - 토큰 row 없음 → invalid
 *  - 본인이 grant owner → 의미 없음, ok 반환 (이미 본인이 access)
 *  - 이미 다른 사람에게 redeem됨 → invalid (한 토큰 = 한 사람)
 *  - 이미 본인에게 redeem됨 → 멱등 ok 반환
 *  - 정상 → granted_to_user_id 채우고 ok
 */
export async function redeemRouteInviteLinkAction(input: {
  routeId: string;
  token: string;
}): Promise<
  | { ok: true; status: "redeemed" | "already-redeemed" | "self-owner" }
  | { ok: false; error: string }
> {
  const viewerId = await getSupabaseAuthUserIdOnly();
  if (!viewerId) return { ok: false, error: "unauthorized" };
  if (!input.token) return { ok: false, error: "missing-token" };
  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-role-unavailable" };

  const { data: invite, error: invErr } = await svc
    .from("route_share_invites")
    .select("id, grant_id, granted_to_user_id, status")
    .eq("invite_token", input.token)
    .maybeSingle();
  if (invErr || !invite) return { ok: false, error: "invite-not-found" };
  if (invite.status !== "active") return { ok: false, error: "invite-inactive" };

  const { data: grant, error: grantErr } = await svc
    .from("route_access_grants")
    .select("id, route_id, owner_user_id, expires_at")
    .eq("id", invite.grant_id)
    .maybeSingle();
  if (grantErr || !grant) return { ok: false, error: "grant-not-found" };
  if (grant.route_id !== input.routeId) return { ok: false, error: "route-mismatch" };
  if (new Date(grant.expires_at).getTime() < Date.now()) return { ok: false, error: "grant-expired" };

  if (grant.owner_user_id === viewerId) {
    return { ok: true, status: "self-owner" };
  }

  if (invite.granted_to_user_id) {
    if (invite.granted_to_user_id === viewerId) {
      return { ok: true, status: "already-redeemed" };
    }
    return { ok: false, error: "invite-claimed" };
  }

  const { error: updErr } = await svc
    .from("route_share_invites")
    .update({
      granted_to_user_id: viewerId,
      redeemed_at: new Date().toISOString(),
    })
    .eq("id", invite.id);
  if (updErr) {
    if (updErr.code === "23505") return { ok: true, status: "already-redeemed" };
    return { ok: false, error: updErr.message };
  }
  return { ok: true, status: "redeemed" };
}

/** Web Crypto 기반 22자 base64url 토큰(≈128bit). Node/Edge 양쪽 동작. */
function generateInviteToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // base64url: + → -, / → _, padding 제거
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
