/**
 * Mock route access resolver. Phase 3A — DB 미연동.
 * 추후 Phase 3B에서 서버 액션 + Supabase 조회로 교체.
 *
 * 단순 in-memory mock — 데모 시나리오용 시드 + sessionStorage 영속화.
 */

import type {
  RouteAccessDecision,
  RouteAccessGrant,
  RouteShareInvite,
  RouteTicketPack,
} from "@/types/route-access";
import { ROUTE_ACCESS_WINDOW_DAYS } from "@/types/route-access";

const STORAGE_KEY = "haru.routeAccess.mock.v1";

type Db = {
  grants: RouteAccessGrant[];
  packs: RouteTicketPack[];
  invites: RouteShareInvite[];
};

function emptyDb(): Db {
  return { grants: [], packs: [], invites: [] };
}

function loadDb(): Db {
  if (typeof window === "undefined") return emptyDb();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDb();
    const parsed = JSON.parse(raw) as Db;
    return {
      grants: parsed.grants ?? [],
      packs: parsed.packs ?? [],
      invites: parsed.invites ?? [],
    };
  } catch {
    return emptyDb();
  }
}

function saveDb(db: Db): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* ignore quota */
  }
}

function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function plus90Days(): string {
  return new Date(Date.now() + ROUTE_ACCESS_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/** 결제 성공 시 mock으로 grant 1건 생성. */
export function mockGrantSingle(routeId: string, ownerUserId: string): RouteAccessGrant {
  const db = loadDb();
  const grant: RouteAccessGrant = {
    id: id("grant"),
    route_id: routeId,
    owner_user_id: ownerUserId,
    source: "single",
    expires_at: plus90Days(),
    created_at: new Date().toISOString(),
  };
  db.grants.push(grant);
  saveDb(db);
  return grant;
}

/** Trio/Penta 구매 시 ticket pack 생성. */
export function mockGrantPack(ownerUserId: string, packSize: 3 | 5): RouteTicketPack {
  const db = loadDb();
  const pack: RouteTicketPack = {
    id: id("pack"),
    owner_user_id: ownerUserId,
    pack_size: packSize,
    tickets_used: 0,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };
  db.packs.push(pack);
  saveDb(db);
  return pack;
}

/** ticket 1장 소모해서 그 루트에 대해 grant 발급. */
export function mockConsumeTicket(packId: string, routeId: string, ownerUserId: string): RouteAccessGrant | null {
  const db = loadDb();
  const pack = db.packs.find((p) => p.id === packId);
  if (!pack) return null;
  if (pack.tickets_used >= pack.pack_size) return null;
  pack.tickets_used += 1;
  const grant: RouteAccessGrant = {
    id: id("grant"),
    route_id: routeId,
    owner_user_id: ownerUserId,
    source: pack.pack_size === 3 ? "trio" : "penta",
    expires_at: plus90Days(),
    created_at: new Date().toISOString(),
  };
  db.grants.push(grant);
  saveDb(db);
  return grant;
}

/** 공유 초대 발급. grant당 active 2개 한도. */
export function mockGrantShareInvite(
  grantId: string,
  grantedByUserId: string,
  grantedToUserId: string,
): { ok: true; invite: RouteShareInvite } | { ok: false; reason: "over-limit" | "duplicate" | "not-owner" } {
  const db = loadDb();
  const grant = db.grants.find((g) => g.id === grantId);
  if (!grant) return { ok: false, reason: "not-owner" };
  if (grant.owner_user_id !== grantedByUserId) return { ok: false, reason: "not-owner" };
  const active = db.invites.filter((i) => i.grant_id === grantId && i.status === "active");
  if (active.length >= 2) return { ok: false, reason: "over-limit" };
  if (active.some((i) => i.granted_to_user_id === grantedToUserId)) {
    return { ok: false, reason: "duplicate" };
  }
  const invite: RouteShareInvite = {
    id: id("inv"),
    grant_id: grantId,
    granted_by_user_id: grantedByUserId,
    granted_to_user_id: grantedToUserId,
    status: "active",
    created_at: new Date().toISOString(),
  };
  db.invites.push(invite);
  saveDb(db);
  return { ok: true, invite };
}

export function mockRevokeShareInvite(inviteId: string): boolean {
  const db = loadDb();
  const inv = db.invites.find((i) => i.id === inviteId);
  if (!inv || inv.status !== "active") return false;
  inv.status = "revoked";
  inv.revoked_at = new Date().toISOString();
  saveDb(db);
  return true;
}

export function mockListGrantsForOwner(ownerUserId: string): RouteAccessGrant[] {
  return loadDb().grants.filter((g) => g.owner_user_id === ownerUserId);
}

export function mockListActiveInvitesForGrant(grantId: string): RouteShareInvite[] {
  return loadDb().invites.filter((i) => i.grant_id === grantId && i.status === "active");
}

export function mockListPacksForOwner(ownerUserId: string): RouteTicketPack[] {
  return loadDb().packs.filter((p) => p.owner_user_id === ownerUserId);
}

/**
 * 클라이언트 측 mock 접근 판정.
 * 실제 운영에선 서버에서 결정해야 한다 (RLS 통과 + 신뢰 가능).
 */
export function mockResolveAccess({
  routeId,
  viewerUserId,
}: {
  routeId: string;
  viewerUserId: string | null;
}): RouteAccessDecision {
  if (!viewerUserId) {
    return { canView: false, reason: "anonymous" };
  }
  const db = loadDb();
  const now = Date.now();

  // 1. 본인 grant
  const own = db.grants.find(
    (g) => g.route_id === routeId && g.owner_user_id === viewerUserId && new Date(g.expires_at).getTime() > now,
  );
  if (own) {
    return { canView: true, reason: "owner", expires_at: own.expires_at };
  }

  // 2. 공유 초대 받음
  const invite = db.invites.find(
    (i) => i.granted_to_user_id === viewerUserId && i.status === "active",
  );
  if (invite) {
    const sharedGrant = db.grants.find(
      (g) => g.id === invite.grant_id && g.route_id === routeId && new Date(g.expires_at).getTime() > now,
    );
    if (sharedGrant) {
      return {
        canView: true,
        reason: "shared-invite",
        expires_at: sharedGrant.expires_at,
        sharedBy: { user_id: sharedGrant.owner_user_id, display_name: sharedGrant.owner_user_id },
      };
    }
  }

  // 3. 잔여 티켓
  const packs = db.packs.filter((p) => p.owner_user_id === viewerUserId);
  const remaining = packs.reduce((sum, p) => sum + Math.max(0, p.pack_size - p.tickets_used), 0);
  if (remaining > 0) {
    const usablePack = packs.find((p) => p.tickets_used < p.pack_size);
    return {
      canView: false,
      reason: "ticket-prompt",
      ticketsRemaining: remaining,
      ticketPackId: usablePack?.id ?? null,
    };
  }
  // 4. 패키지 소진
  if (packs.length > 0) {
    return { canView: false, reason: "tickets-exhausted" };
  }
  // 5. 일반
  return { canView: false, reason: "no-access" };
}
