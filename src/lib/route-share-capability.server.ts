/**
 * 하루루트 상세 — 재공유 capability 판정.
 * 정책: 열람 가능한 공유 링크 방문자는 동일 URL을 다시 전달할 수 있다(소유권·복제 없음).
 */
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { ENABLE_PAID_ROUTE_LOCK } from "@/lib/feature-flags";
import { isFreePublicRouteStatus } from "@/lib/route-visibility";
import { resolveRouteAccessServer } from "@/lib/route-access.server";
import type { RouteShareContext, ShareCapability } from "@/types/share-capability";
import { withLocalePath } from "@/lib/auth/route-path";
import type { AppLocale } from "@/types/haru";

function buildInvitePath(routeId: string, token: string): string {
  return `/routes/${routeId}?invite=${encodeURIComponent(token)}`;
}

/** 서버에서 reshare용 URL 후보 조회 — invite 토큰 우선, 없으면 canonical route. */
async function resolveReshareUrl({
  routeId,
  userId,
  inviteTokenFromRequest,
  locale,
}: {
  routeId: string;
  userId: string | null;
  inviteTokenFromRequest?: string | null;
  locale: AppLocale;
}): Promise<string> {
  const basePath = withLocalePath(locale, `/routes/${routeId}`);
  if (inviteTokenFromRequest?.trim()) {
    return withLocalePath(locale, buildInvitePath(routeId, inviteTokenFromRequest.trim()));
  }

  if (!userId) return basePath;

  const sb = await getServerSupabaseForUser();
  if (!sb) return basePath;

  const { data: inviteRows } = await sb
    .from("route_share_invites")
    .select("invite_token, grant_id")
    .eq("granted_to_user_id", userId)
    .eq("status", "active")
    .not("invite_token", "is", null);

  if (inviteRows?.length) {
    const grantIds = inviteRows.map((r) => r.grant_id as string);
    const { data: grants } = await sb
      .from("route_access_grants")
      .select("id, route_id")
      .in("id", grantIds)
      .eq("route_id", routeId);
    const grantIdSet = new Set((grants ?? []).map((g) => g.id as string));
    const match = inviteRows.find((r) => grantIdSet.has(r.grant_id as string) && r.invite_token);
    if (match?.invite_token) {
      return withLocalePath(locale, buildInvitePath(routeId, match.invite_token as string));
    }
  }

  return basePath;
}

function mapAccessToCapability(
  canView: boolean,
  reason: string | undefined,
  inviteAccessHint: "claimed" | "invalid" | null,
): ShareCapability {
  if (inviteAccessHint === "invalid") return "expired";
  if (inviteAccessHint === "claimed") return "restricted";
  if (!canView) {
    if (reason === "anonymous" || reason === "no-access") return "restricted";
    if (reason === "tickets-exhausted") return "restricted";
    return "private";
  }
  return "can_reshare";
}

/**
 * 페이지 SSR용 — owner_grant는 호출 측에서 owner_manage로 분기.
 */
export async function resolveRouteShareContextServer(input: {
  routeId: string;
  userId: string | null;
  locale: AppLocale;
  initialUnlocked: boolean;
  ownerGrantId: string | null;
  routeStatus?: string | null;
  inviteAccessHint?: "claimed" | "invalid" | null;
  inviteTokenFromRequest?: string | null;
}): Promise<RouteShareContext> {
  if (!ENABLE_PAID_ROUTE_LOCK && isFreePublicRouteStatus(input.routeStatus)) {
    const shareUrl = await resolveReshareUrl({
      routeId: input.routeId,
      userId: input.userId,
      inviteTokenFromRequest: input.inviteTokenFromRequest,
      locale: input.locale,
    });
    return { capability: "can_reshare", shareUrl };
  }

  if (input.ownerGrantId && ENABLE_PAID_ROUTE_LOCK) {
    return { capability: "owner_manage", shareUrl: null };
  }

  if (!input.initialUnlocked) {
    const cap = mapAccessToCapability(false, undefined, input.inviteAccessHint ?? null);
    return { capability: cap, shareUrl: null };
  }

  const access = await resolveRouteAccessServer({
    routeId: input.routeId,
    userId: input.userId,
  });

  if (!access.canView) {
    const cap = mapAccessToCapability(false, access.reason, input.inviteAccessHint ?? null);
    return { capability: cap, shareUrl: null };
  }

  const shareUrl = await resolveReshareUrl({
    routeId: input.routeId,
    userId: input.userId,
    inviteTokenFromRequest: input.inviteTokenFromRequest,
    locale: input.locale,
  });

  return { capability: "can_reshare", shareUrl };
}

/** 클라이언트 재확인용 — 라우트 존재·공개 여부 포함. */
export async function checkRouteShareCapabilityServer(input: {
  routeId: string;
  inviteToken?: string | null;
  locale?: AppLocale;
}): Promise<RouteShareContext> {
  const locale = input.locale ?? "ko";
  const uid = await getSupabaseAuthUserIdOnly();

  let routeStatus: string | null = null;
  const svc = createServiceRoleSupabase();
  if (svc) {
    const { data: routeRow } = await svc
      .from("routes")
      .select("id, status, deleted_at")
      .eq("id", input.routeId)
      .maybeSingle();
    if (!routeRow) return { capability: "deleted", shareUrl: null };
    const row = routeRow as { deleted_at?: string | null; status?: string };
    routeStatus = row.status ?? null;
    if (row.deleted_at) return { capability: "deleted", shareUrl: null };
    if (row.status === "private" || row.status === "deprecated" || row.status === "draft") {
      return { capability: "private", shareUrl: null };
    }
  }

  if (!ENABLE_PAID_ROUTE_LOCK && isFreePublicRouteStatus(routeStatus)) {
    const shareUrl = await resolveReshareUrl({
      routeId: input.routeId,
      userId: uid,
      inviteTokenFromRequest: input.inviteToken,
      locale,
    });
    return { capability: "can_reshare", shareUrl };
  }

  const access = await resolveRouteAccessServer({ routeId: input.routeId, userId: uid });
  if (access.ownerGrantId && ENABLE_PAID_ROUTE_LOCK) {
    return { capability: "owner_manage", shareUrl: null };
  }
  if (!access.canView) {
    return {
      capability: mapAccessToCapability(false, access.reason, null),
      shareUrl: null,
    };
  }

  const shareUrl = await resolveReshareUrl({
    routeId: input.routeId,
    userId: uid,
    inviteTokenFromRequest: input.inviteToken,
    locale,
  });
  return { capability: "can_reshare", shareUrl };
}
