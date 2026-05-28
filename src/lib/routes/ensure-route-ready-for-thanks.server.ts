import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { isFreePublicRouteStatus } from "@/lib/route-visibility";
import { ensureRouteSyncedForView, resolveRouteSyncSource } from "@/lib/routes/ensure-route-from-post.server";

export type RouteRowForThanks = {
  id: string;
  status: string;
  title_ko: string | null;
  title_en: string | null;
  guardian_user_id: string;
  deleted_at: string | null;
};

/**
 * 고마움 결제 전 — 시드 루트 materialize + sample `public` 승격.
 */
export async function ensureRouteReadyForThanks(
  routeId: string,
  haruiUserId: string,
): Promise<{ ok: true; route: RouteRowForThanks } | { ok: false; error: string }> {
  await ensureRouteSyncedForView(routeId);

  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-unavailable" };

  let route = await loadRouteRow(svc, routeId);
  if (!route) return { ok: false, error: "route-not-found" };
  if (route.deleted_at) return { ok: false, error: "route-not-found" };
  if (route.guardian_user_id !== haruiUserId) return { ok: false, error: "harui-mismatch" };

  if (!isFreePublicRouteStatus(route.status)) {
    const source = resolveRouteSyncSource(routeId);
    const publishable =
      source?.postStatus === "approved" || source?.postStatus === "published";
    if (publishable) {
      const { error } = await svc.from("routes").update({ status: "public" }).eq("id", routeId);
      if (error) {
        console.error("[ensureRouteReadyForThanks] publish", error);
        return { ok: false, error: "route-not-public" };
      }
      route = { ...route, status: "public" };
    } else {
      return { ok: false, error: "route-not-public" };
    }
  }

  return { ok: true, route };
}

async function loadRouteRow(
  svc: ReturnType<typeof createServiceRoleSupabase>,
  routeId: string,
): Promise<RouteRowForThanks | null> {
  if (!svc) return null;
  const { data } = await svc
    .from("routes")
    .select("id, status, deleted_at, title_ko, title_en, guardian_user_id")
    .eq("id", routeId)
    .maybeSingle();
  if (!data) return null;
  return data as RouteRowForThanks;
}
