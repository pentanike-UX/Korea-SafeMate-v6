import type { SupabaseClient } from "@supabase/supabase-js";
import { ENABLE_PAID_ROUTE_LOCK } from "@/lib/feature-flags";
import {
  ensureRouteSyncedForView,
  resolveRouteSyncSource,
} from "@/lib/routes/ensure-route-from-post.server";
import { buildHaruRouteBundleFromSyncSource } from "@/lib/routes/haru-route-from-journey.server";
import {
  fetchHaruRouteFromSupabase,
  type FetchedHaruBundle,
} from "@/lib/routes/haru-route-from-supabase.server";
import { isFreePublicRouteStatus } from "@/lib/route-visibility";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

function acceptBundle(bundle: FetchedHaruBundle | null): bundle is FetchedHaruBundle {
  if (!bundle) return false;
  if (!ENABLE_PAID_ROUTE_LOCK) return bundle.haru.spots.length > 0;
  return isFreePublicRouteStatus(bundle.status) && bundle.haru.spots.length > 0;
}

async function tryFetch(
  sb: SupabaseClient,
  routeId: string,
): Promise<FetchedHaruBundle | null> {
  const bundle = await fetchHaruRouteFromSupabase(sb, routeId);
  return acceptBundle(bundle) ? bundle : null;
}

/**
 * 하루루트 상세 SSR용 — DB 조회 → lazy sync → journey 인메모리 폴백.
 */
export async function fetchHaruRouteBundleForView(routeId: string): Promise<{
  bundle: FetchedHaruBundle | null;
  fromDb: boolean;
}> {
  const userSb = await getServerSupabaseForUser();
  let bundle = userSb ? await tryFetch(userSb, routeId) : null;
  let fromDb = Boolean(bundle);

  const svc = createServiceRoleSupabase();
  if (!bundle && svc) {
    bundle = await tryFetch(svc, routeId);
    fromDb = Boolean(bundle);
  }

  if (!bundle) {
    const materialized = await ensureRouteSyncedForView(routeId);
    if (materialized && svc) {
      bundle = await tryFetch(svc, routeId);
      fromDb = Boolean(bundle);
    }
    if (!bundle && userSb) {
      bundle = await tryFetch(userSb, routeId);
      fromDb = Boolean(bundle);
    }
  }

  if (!bundle) {
    const source = resolveRouteSyncSource(routeId);
    if (source && source.routeJourney.spots.length > 0) {
      bundle = buildHaruRouteBundleFromSyncSource(routeId, source);
      fromDb = false;
    }
  }

  return { bundle, fromDb };
}
