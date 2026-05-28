/**
 * 하루루트 상세 — 열람 잠금/해제 정책 (서버).
 * ENABLE_PAID_ROUTE_LOCK=false 시 공개 루트는 무료 전체 열람.
 */
import { ENABLE_PAID_ROUTE_LOCK } from "@/lib/feature-flags";
import { isFreePublicRouteStatus, routeBlockedMessageKey } from "@/lib/route-visibility";
import { resolveRouteAccessServer } from "@/lib/route-access.server";
import type { RouteAccessDecision } from "@/types/route-access";

export type RouteViewLogSource =
  | "owner"
  | "shared-invite"
  | "ticket"
  | "custom-self"
  | "public-free";

export type RouteViewPolicyResult = {
  initialUnlocked: boolean;
  blockedMessageKey: ReturnType<typeof routeBlockedMessageKey>;
  sharedBy: RouteAccessDecision["sharedBy"];
  ownerGrantId: string | null;
  lockedHint: {
    reason: "ticket-prompt" | "tickets-exhausted";
    ticketsRemaining?: number | null;
    ticketPackId?: string | null;
  } | null;
  viewLogSource: RouteViewLogSource | null;
};

export async function resolveRouteViewPolicy(input: {
  routeId: string;
  routeType: "sample" | "custom" | "mock";
  routeStatus: string;
  routeDeleted?: boolean;
  userId: string | null;
  wantsPreview: boolean;
  fromDb: boolean;
}): Promise<RouteViewPolicyResult> {
  const blockedKey = routeBlockedMessageKey(input.routeStatus, Boolean(input.routeDeleted));

  if (input.routeType === "mock") {
    return {
      initialUnlocked: !ENABLE_PAID_ROUTE_LOCK || Boolean(input.userId) || input.wantsPreview,
      blockedMessageKey: null,
      sharedBy: null,
      ownerGrantId: null,
      lockedHint: null,
      viewLogSource: input.userId ? "public-free" : null,
    };
  }

  if (blockedKey) {
    return {
      initialUnlocked: false,
      blockedMessageKey: blockedKey,
      sharedBy: null,
      ownerGrantId: null,
      lockedHint: null,
      viewLogSource: null,
    };
  }

  // 무료 확산: 공개 샘플·공개 커스텀(조회 가능 시) 전체 열람
  if (!ENABLE_PAID_ROUTE_LOCK && isFreePublicRouteStatus(input.routeStatus)) {
    let ownerGrantId: string | null = null;
    if (input.userId) {
      const access = await resolveRouteAccessServer({
        routeId: input.routeId,
        userId: input.userId,
      });
      if (access.ownerGrantId) ownerGrantId = access.ownerGrantId;
    }
    return {
      initialUnlocked: true,
      blockedMessageKey: null,
      sharedBy: null,
      ownerGrantId,
      lockedHint: null,
      viewLogSource: "public-free",
    };
  }

  // 레거시 유료 잠금
  let initialUnlocked = input.fromDb && input.routeType === "custom" && !input.wantsPreview;
  let viewLogSource: RouteViewLogSource | null = initialUnlocked ? "custom-self" : null;
  let accessSharedBy: RouteViewPolicyResult["sharedBy"] = null;
  let accessOwnerGrantId: string | null = null;
  let accessLockedHint: RouteViewPolicyResult["lockedHint"] = null;

  if (!initialUnlocked) {
    const decision = await resolveRouteAccessServer({
      routeId: input.routeId,
      userId: input.userId,
    });
    if (decision.canView) {
      initialUnlocked = true;
      if (decision.reason === "shared-invite" && decision.sharedBy) {
        accessSharedBy = decision.sharedBy;
        viewLogSource = "shared-invite";
      }
      if (decision.reason === "owner" && decision.ownerGrantId) {
        accessOwnerGrantId = decision.ownerGrantId;
        viewLogSource = "owner";
      }
    } else if (!input.wantsPreview && decision.reason === "ticket-prompt") {
      accessLockedHint = {
        reason: "ticket-prompt",
        ticketsRemaining: decision.ticketsRemaining ?? null,
        ticketPackId: decision.ticketPackId ?? null,
      };
    } else if (!input.wantsPreview && decision.reason === "tickets-exhausted") {
      accessLockedHint = { reason: "tickets-exhausted" };
    }
  }

  return {
    initialUnlocked,
    blockedMessageKey: null,
    sharedBy: accessSharedBy,
    ownerGrantId: accessOwnerGrantId,
    lockedHint: accessLockedHint,
    viewLogSource,
  };
}
