/**
 * Admin 운영 — 전체 route_access_grants / route_share_invites / route_ticket_packs 조회·관리.
 * super_admin만 호출 가능. 정책: docs/payment-and-share-policy.md
 */

import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

export interface AdminGrantRow {
  grant_id: string;
  route_id: string;
  owner_user_id: string;
  owner_display_name: string;
  source: "single" | "trio" | "penta" | "admin-comp";
  expires_at: string;
  created_at: string;
  active_invite_count: number;
}

export interface AdminInviteRow {
  invite_id: string;
  grant_id: string;
  route_id: string;
  granted_by_user_id: string;
  granted_by_display_name: string;
  granted_to_user_id: string;
  granted_to_display_name: string;
  status: "active" | "revoked";
  created_at: string;
  revoked_at: string | null;
}

export interface AdminPackRow {
  pack_id: string;
  owner_user_id: string;
  owner_display_name: string;
  pack_size: 3 | 5;
  tickets_used: number;
  expires_at: string;
  created_at: string;
}

export interface AdminAbuseSignalRow {
  id: string;
  signal_type: string;
  severity: "info" | "warn" | "critical";
  grant_id: string | null;
  actor_user_id: string | null;
  actor_display_name: string | null;
  target_user_id: string | null;
  target_display_name: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export async function requireSuperAdminUserId(): Promise<string | null> {
  const sb = await getServerSupabaseForUser();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  if ((data as { app_role?: string } | null)?.app_role !== "super_admin") return null;
  return user.id;
}

async function profileMap(
  svc: ReturnType<typeof createServiceRoleSupabase>,
  userIds: string[],
): Promise<Map<string, string>> {
  if (!svc || userIds.length === 0) return new Map();
  const { data } = await svc
    .from("guardian_profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);
  return new Map(
    (data ?? []).map((r: { user_id: string; display_name?: string | null }) => [
      r.user_id,
      r.display_name?.trim() || r.user_id.slice(0, 8),
    ]),
  );
}

export async function adminListRoutePasses(): Promise<{
  grants: AdminGrantRow[];
  invites: AdminInviteRow[];
  packs: AdminPackRow[];
  signals: AdminAbuseSignalRow[];
}> {
  const adminId = await requireSuperAdminUserId();
  if (!adminId) return { grants: [], invites: [], packs: [], signals: [] };
  const svc = createServiceRoleSupabase();
  if (!svc) return { grants: [], invites: [], packs: [], signals: [] };

  // grants — 최근 500건.
  const { data: grants } = await svc
    .from("route_access_grants")
    .select("id, route_id, owner_user_id, source, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  const grantRows = (grants ?? []) as Array<{
    id: string;
    route_id: string;
    owner_user_id: string;
    source: AdminGrantRow["source"];
    expires_at: string;
    created_at: string;
  }>;

  // active invite count per grant
  const inviteCountByGrant = new Map<string, number>();
  if (grantRows.length > 0) {
    const { data: invs } = await svc
      .from("route_share_invites")
      .select("grant_id, status")
      .in("grant_id", grantRows.map((g) => g.id))
      .eq("status", "active");
    for (const i of (invs ?? []) as Array<{ grant_id: string }>) {
      inviteCountByGrant.set(i.grant_id, (inviteCountByGrant.get(i.grant_id) ?? 0) + 1);
    }
  }

  // owner profiles
  const ownerNames = await profileMap(svc, [...new Set(grantRows.map((g) => g.owner_user_id))]);

  const grantsOut: AdminGrantRow[] = grantRows.map((g) => ({
    grant_id: g.id,
    route_id: g.route_id,
    owner_user_id: g.owner_user_id,
    owner_display_name: ownerNames.get(g.owner_user_id) ?? g.owner_user_id.slice(0, 8),
    source: g.source,
    expires_at: g.expires_at,
    created_at: g.created_at,
    active_invite_count: inviteCountByGrant.get(g.id) ?? 0,
  }));

  // invites — 최근 200건.
  const { data: invitesRaw } = await svc
    .from("route_share_invites")
    .select("id, grant_id, granted_by_user_id, granted_to_user_id, status, created_at, revoked_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const inviteRows = (invitesRaw ?? []) as Array<{
    id: string;
    grant_id: string;
    granted_by_user_id: string;
    granted_to_user_id: string;
    status: AdminInviteRow["status"];
    created_at: string;
    revoked_at: string | null;
  }>;
  const grantById = new Map(grantRows.map((g) => [g.id, g] as const));
  const inviteUserIds = [
    ...new Set([
      ...inviteRows.map((i) => i.granted_by_user_id),
      ...inviteRows.map((i) => i.granted_to_user_id),
    ]),
  ];
  const inviteNames = await profileMap(svc, inviteUserIds);
  const invitesOut: AdminInviteRow[] = inviteRows.map((i) => ({
    invite_id: i.id,
    grant_id: i.grant_id,
    route_id: grantById.get(i.grant_id)?.route_id ?? "—",
    granted_by_user_id: i.granted_by_user_id,
    granted_by_display_name: inviteNames.get(i.granted_by_user_id) ?? i.granted_by_user_id.slice(0, 8),
    granted_to_user_id: i.granted_to_user_id,
    granted_to_display_name: inviteNames.get(i.granted_to_user_id) ?? i.granted_to_user_id.slice(0, 8),
    status: i.status,
    created_at: i.created_at,
    revoked_at: i.revoked_at,
  }));

  // packs — 최근 200건.
  const { data: packsRaw } = await svc
    .from("route_ticket_packs")
    .select("id, owner_user_id, pack_size, tickets_used, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const packRows = (packsRaw ?? []) as Array<{
    id: string;
    owner_user_id: string;
    pack_size: 3 | 5;
    tickets_used: number;
    expires_at: string;
    created_at: string;
  }>;
  const packOwnerNames = await profileMap(svc, [...new Set(packRows.map((p) => p.owner_user_id))]);
  const packsOut: AdminPackRow[] = packRows.map((p) => ({
    pack_id: p.id,
    owner_user_id: p.owner_user_id,
    owner_display_name: packOwnerNames.get(p.owner_user_id) ?? p.owner_user_id.slice(0, 8),
    pack_size: p.pack_size,
    tickets_used: p.tickets_used,
    expires_at: p.expires_at,
    created_at: p.created_at,
  }));

  // abuse signals — 최근 100건.
  const { data: signalsRaw } = await svc
    .from("route_abuse_signals")
    .select("id, signal_type, severity, grant_id, actor_user_id, target_user_id, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const sigRows = (signalsRaw ?? []) as Array<{
    id: string;
    signal_type: string;
    severity: "info" | "warn" | "critical";
    grant_id: string | null;
    actor_user_id: string | null;
    target_user_id: string | null;
    payload: Record<string, unknown>;
    created_at: string;
  }>;
  const sigUserIds = [
    ...new Set(
      sigRows
        .flatMap((s) => [s.actor_user_id, s.target_user_id])
        .filter((u): u is string => !!u),
    ),
  ];
  const sigNames = await profileMap(svc, sigUserIds);
  const signals: AdminAbuseSignalRow[] = sigRows.map((s) => ({
    id: s.id,
    signal_type: s.signal_type,
    severity: s.severity,
    grant_id: s.grant_id,
    actor_user_id: s.actor_user_id,
    actor_display_name: s.actor_user_id ? sigNames.get(s.actor_user_id) ?? null : null,
    target_user_id: s.target_user_id,
    target_display_name: s.target_user_id ? sigNames.get(s.target_user_id) ?? null : null,
    payload: s.payload,
    created_at: s.created_at,
  }));

  return { grants: grantsOut, invites: invitesOut, packs: packsOut, signals };
}
