"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { requireSuperAdminUserId } from "@/lib/route-access-admin.server";
import { logAbuseSignal } from "@/lib/route-abuse-signals.server";

const ROUTE = "/admin/route-passes";

/** 운영 — 임의 grant 만료 강제(now()로 expires_at 갱신). 어뷰징/환불 대응. */
export async function adminExpireGrantAction(input: {
  grantId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireSuperAdminUserId();
  if (!admin) return { ok: false, error: "forbidden" };
  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-role-unavailable" };
  const { error } = await svc
    .from("route_access_grants")
    .update({ expires_at: new Date().toISOString() })
    .eq("id", input.grantId);
  if (error) return { ok: false, error: error.message };
  await logAbuseSignal({
    signalType: "grant-expired-manual",
    severity: "warn",
    grantId: input.grantId,
    actorUserId: admin,
  });
  revalidatePath(ROUTE);
  return { ok: true };
}

/** 운영 — 임의 invite 회수. */
export async function adminRevokeInviteAction(input: {
  inviteId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireSuperAdminUserId();
  if (!admin) return { ok: false, error: "forbidden" };
  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-role-unavailable" };
  const { data: inv } = await svc
    .from("route_share_invites")
    .select("grant_id, granted_to_user_id")
    .eq("id", input.inviteId)
    .maybeSingle();
  const { error } = await svc
    .from("route_share_invites")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", input.inviteId)
    .eq("status", "active");
  if (error) return { ok: false, error: error.message };
  await logAbuseSignal({
    signalType: "invite-cycle-warn",
    severity: "info",
    grantId: (inv as { grant_id?: string } | null)?.grant_id ?? null,
    actorUserId: admin,
    targetUserId: (inv as { granted_to_user_id?: string } | null)?.granted_to_user_id ?? null,
    payload: { admin_revoked: true },
  });
  revalidatePath(ROUTE);
  return { ok: true };
}

/** 운영 — admin-comp 발급(무상 grant). 마케팅·보상·CS 대응용. */
export async function adminIssueCompGrantAction(input: {
  routeId: string;
  ownerUserId: string;
  /** 발급 사유 — 최소 3자. CHECK 제약으로 DB에서도 강제. */
  reason: string;
  /** 90일 외 다른 기간(일 단위). 기본 90일. */
  validDays?: number;
}): Promise<{ ok: true; grantId: string } | { ok: false; error: string }> {
  const admin = await requireSuperAdminUserId();
  if (!admin) return { ok: false, error: "forbidden" };
  if (!input.routeId || !input.ownerUserId) return { ok: false, error: "invalid-input" };
  const reason = input.reason?.trim() ?? "";
  if (reason.length < 3) return { ok: false, error: "reason-required" };
  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-role-unavailable" };
  const days = input.validDays && input.validDays > 0 ? Math.min(365, input.validDays) : 90;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await svc
    .from("route_access_grants")
    .upsert(
      {
        route_id: input.routeId,
        owner_user_id: input.ownerUserId,
        source: "admin-comp",
        expires_at: expires,
        comp_reason: reason,
      },
      { onConflict: "route_id,owner_user_id" },
    )
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert-failed" };
  await logAbuseSignal({
    signalType: "comp-issued",
    severity: "info",
    grantId: data.id,
    actorUserId: admin,
    targetUserId: input.ownerUserId,
    payload: { valid_days: days, route_id: input.routeId, reason },
  });
  revalidatePath(ROUTE);
  return { ok: true, grantId: data.id };
}
