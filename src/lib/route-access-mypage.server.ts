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
