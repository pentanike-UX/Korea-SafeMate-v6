/**
 * 마이페이지 — 본인이 보유한 route grant·ticket pack 목록 조회.
 * 정책: docs/payment-and-share-policy.md
 */

import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export interface RoutePassGrantRow {
  grant_id: string;
  route_id: string;
  source: "single" | "trio" | "penta" | "admin-comp";
  expires_at: string;
  days_remaining: number;
  active_invite_count: number;
  route_title: string | null;
}

export interface RecentViewRow {
  view_id: string;
  route_id: string;
  route_title: string | null;
  source: "owner" | "shared-invite" | "ticket" | "custom-self";
  viewed_at: string;
}

export interface SharedInviteHistoryRow {
  invite_id: string;
  grant_id: string;
  route_id: string;
  route_title: string | null;
  grantee_user_id: string;
  grantee_display_name: string;
  grantee_avatar_url: string | null;
  status: "active" | "revoked";
  created_at: string;
  revoked_at: string | null;
}

export interface RoutePassPackRow {
  pack_id: string;
  pack_size: 3 | 5;
  tickets_used: number;
  tickets_remaining: number;
  expires_at: string;
  days_remaining: number;
}

function daysBetween(future: string): number {
  const ms = new Date(future).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/** 본인 grant 목록 + 활성 invite count + route title. 만료 안된 것만 (expires_at > now). */
export async function listMyRoutePasses(locale: "ko" | "en" | "ja" | "th" | "vi"): Promise<{
  grants: RoutePassGrantRow[];
  packs: RoutePassPackRow[];
}> {
  const userId = await getSupabaseAuthUserIdOnly();
  const sb = await getServerSupabaseForUser();
  if (!userId || !sb) return { grants: [], packs: [] };

  // grants — RLS로 본인만.
  const { data: grants } = await sb
    .from("route_access_grants")
    .select("id, route_id, source, expires_at")
    .eq("owner_user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });

  const grantRows = (grants ?? []) as Array<{
    id: string;
    route_id: string;
    source: "single" | "trio" | "penta" | "admin-comp";
    expires_at: string;
  }>;

  // active invite count per grant (service-role 필요 — 본인이 발급자이므로 RLS도 통과 가능하지만 일관성).
  const svc = createServiceRoleSupabase();
  const grantIds = grantRows.map((g) => g.id);
  const inviteCountByGrant = new Map<string, number>();
  if (svc && grantIds.length > 0) {
    const { data: invs } = await svc
      .from("route_share_invites")
      .select("grant_id, status")
      .in("grant_id", grantIds)
      .eq("status", "active");
    for (const i of (invs ?? []) as Array<{ grant_id: string }>) {
      inviteCountByGrant.set(i.grant_id, (inviteCountByGrant.get(i.grant_id) ?? 0) + 1);
    }
  }

  // route 제목 lookup — UUID 루트만(text route_id 중 UUID 형태인 것만).
  const titleByRoute = new Map<string, string>();
  const uuidRouteIds = grantRows
    .map((g) => g.route_id)
    .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
  if (svc && uuidRouteIds.length > 0) {
    const { data: routes } = await svc
      .from("routes")
      .select("id, title_ko, title_en, title_ja, title_th, title_vi")
      .in("id", uuidRouteIds);
    for (const r of (routes ?? []) as Array<Record<string, string | null>>) {
      const id = r.id as string;
      const pick =
        locale === "ko"
          ? r.title_ko
          : locale === "ja"
            ? r.title_ja
            : locale === "th"
              ? r.title_th
              : locale === "vi"
                ? r.title_vi
                : r.title_en;
      titleByRoute.set(id, (pick ?? r.title_en ?? "Route").toString());
    }
  }

  const grantsOut: RoutePassGrantRow[] = grantRows.map((g) => ({
    grant_id: g.id,
    route_id: g.route_id,
    source: g.source,
    expires_at: g.expires_at,
    days_remaining: daysBetween(g.expires_at),
    active_invite_count: inviteCountByGrant.get(g.id) ?? 0,
    route_title: titleByRoute.get(g.route_id) ?? null,
  }));

  // packs.
  const { data: packs } = await sb
    .from("route_ticket_packs")
    .select("id, pack_size, tickets_used, expires_at")
    .eq("owner_user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });

  const packRows = (packs ?? []) as Array<{
    id: string;
    pack_size: 3 | 5;
    tickets_used: number;
    expires_at: string;
  }>;

  const packsOut: RoutePassPackRow[] = packRows.map((p) => ({
    pack_id: p.id,
    pack_size: p.pack_size,
    tickets_used: p.tickets_used,
    tickets_remaining: Math.max(0, p.pack_size - p.tickets_used),
    expires_at: p.expires_at,
    days_remaining: daysBetween(p.expires_at),
  }));

  return { grants: grantsOut, packs: packsOut };
}

/** 본인 최근 열람 이력 + 공유 이력. */
export async function listMyRouteActivity(
  locale: "ko" | "en" | "ja" | "th" | "vi",
): Promise<{
  recentViews: RecentViewRow[];
  sharedInvites: SharedInviteHistoryRow[];
}> {
  const userId = await getSupabaseAuthUserIdOnly();
  const sb = await getServerSupabaseForUser();
  if (!userId || !sb) return { recentViews: [], sharedInvites: [] };
  const svc = createServiceRoleSupabase();

  // 1) 최근 열람 — 최근 30건. 같은 route 중복 가능.
  const { data: views } = await sb
    .from("route_post_view_events")
    .select("id, route_id, source, created_at")
    .eq("viewer_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  const viewRows = (views ?? []) as Array<{
    id: string;
    route_id: string;
    source: RecentViewRow["source"];
    created_at: string;
  }>;

  // 2) 본인이 발급한 공유 초대 — 최근 30건. revoked 포함.
  const { data: invs } = await sb
    .from("route_share_invites")
    .select("id, grant_id, granted_to_user_id, status, created_at, revoked_at")
    .eq("granted_by_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  const invRows = (invs ?? []) as Array<{
    id: string;
    grant_id: string;
    granted_to_user_id: string;
    status: SharedInviteHistoryRow["status"];
    created_at: string;
    revoked_at: string | null;
  }>;

  // route 제목 lookup — UUID 형식만.
  const uuidRouteIds = [
    ...new Set([
      ...viewRows.map((v) => v.route_id),
      // invites는 grant_id로 잡혀있어서 별도 join 필요 — 아래에서 처리.
    ].filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))),
  ];
  // invites의 grant_id → route_id 매핑
  const grantIds = invRows.map((i) => i.grant_id);
  let grantToRoute = new Map<string, string>();
  if (svc && grantIds.length > 0) {
    const { data: grs } = await svc
      .from("route_access_grants")
      .select("id, route_id")
      .in("id", grantIds);
    grantToRoute = new Map((grs ?? []).map((g: { id: string; route_id: string }) => [g.id, g.route_id]));
  }
  const inviteRouteIds = [...new Set([...grantToRoute.values()].filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))];
  const allRouteIdsForLookup = [...new Set([...uuidRouteIds, ...inviteRouteIds])];
  const titleByRoute = new Map<string, string>();
  if (svc && allRouteIdsForLookup.length > 0) {
    const { data: routes } = await svc
      .from("routes")
      .select("id, title_ko, title_en, title_ja, title_th, title_vi")
      .in("id", allRouteIdsForLookup);
    for (const r of (routes ?? []) as Array<Record<string, string | null>>) {
      const id = r.id as string;
      const pick =
        locale === "ko"
          ? r.title_ko
          : locale === "ja"
            ? r.title_ja
            : locale === "th"
              ? r.title_th
              : locale === "vi"
                ? r.title_vi
                : r.title_en;
      titleByRoute.set(id, (pick ?? r.title_en ?? "Route").toString());
    }
  }

  // grantee 프로필 lookup
  const granteeIds = [...new Set(invRows.map((i) => i.granted_to_user_id))];
  const granteeProfiles = new Map<string, { display_name: string; avatar_url: string | null }>();
  if (svc && granteeIds.length > 0) {
    const { data } = await svc
      .from("guardian_profiles")
      .select("user_id, display_name, photo_url, avatar_image_url")
      .in("user_id", granteeIds);
    for (const p of (data ?? []) as Array<{
      user_id: string;
      display_name?: string | null;
      photo_url?: string | null;
      avatar_image_url?: string | null;
    }>) {
      granteeProfiles.set(p.user_id, {
        display_name: p.display_name?.trim() || "Member",
        avatar_url: p.photo_url ?? p.avatar_image_url ?? null,
      });
    }
  }

  const recentViews: RecentViewRow[] = viewRows.map((v) => ({
    view_id: v.id,
    route_id: v.route_id,
    route_title: titleByRoute.get(v.route_id) ?? null,
    source: v.source,
    viewed_at: v.created_at,
  }));

  const sharedInvites: SharedInviteHistoryRow[] = invRows.map((i) => {
    const routeId = grantToRoute.get(i.grant_id) ?? "—";
    const prof = granteeProfiles.get(i.granted_to_user_id);
    return {
      invite_id: i.id,
      grant_id: i.grant_id,
      route_id: routeId,
      route_title: titleByRoute.get(routeId) ?? null,
      grantee_user_id: i.granted_to_user_id,
      grantee_display_name: prof?.display_name ?? i.granted_to_user_id.slice(0, 8),
      grantee_avatar_url: prof?.avatar_url ?? null,
      status: i.status,
      created_at: i.created_at,
      revoked_at: i.revoked_at,
    };
  });

  return { recentViews, sharedInvites };
}
