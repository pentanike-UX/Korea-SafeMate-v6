"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { requireSuperAdminUserId } from "@/lib/route-access-admin.server";

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
  const { error } = await svc
    .from("route_share_invites")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", input.inviteId)
    .eq("status", "active");
  if (error) return { ok: false, error: error.message };
  revalidatePath(ROUTE);
  return { ok: true };
}

/** 운영 — admin-comp 발급(무상 grant). 마케팅·보상·CS 대응용. */
export async function adminIssueCompGrantAction(input: {
  routeId: string;
  ownerUserId: string;
  /** 90일 외 다른 기간(일 단위). 기본 90일. */
  validDays?: number;
}): Promise<{ ok: true; grantId: string } | { ok: false; error: string }> {
  const admin = await requireSuperAdminUserId();
  if (!admin) return { ok: false, error: "forbidden" };
  if (!input.routeId || !input.ownerUserId) return { ok: false, error: "invalid-input" };
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
      },
      { onConflict: "route_id,owner_user_id" },
    )
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert-failed" };
  revalidatePath(ROUTE);
  return { ok: true, grantId: data.id };
}
