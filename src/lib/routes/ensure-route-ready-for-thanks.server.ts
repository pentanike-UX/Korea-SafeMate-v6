import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { isFreePublicRouteStatus } from "@/lib/route-visibility";
import { ensureRouteSyncedForView, resolveRouteSyncSource } from "@/lib/routes/ensure-route-from-post.server";
import { createClient } from "@supabase/supabase-js";

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
  const svc = createServiceRoleSupabase();
  if (!svc) {
    // Preview 환경 등에서 service role key가 없을 수 있다.
    // 이 경우에는 공개 상태만 검증하고 승격(public promote)은 수행하지 않는다.
    const anon = createAnonSupabase();
    if (!anon) return { ok: false, error: "service-unavailable" };
    const route = await loadRouteRow(anon, routeId);
    if (!route) return { ok: false, error: "route-not-found" };
    if (route.deleted_at) return { ok: false, error: "route-not-found" };
    if (route.guardian_user_id !== haruiUserId) return { ok: false, error: "harui-mismatch" };
    if (!isFreePublicRouteStatus(route.status)) return { ok: false, error: "route-not-public" };
    return { ok: true, route };
  }

  await ensureRouteSyncedForView(routeId);

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

function createAnonSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
