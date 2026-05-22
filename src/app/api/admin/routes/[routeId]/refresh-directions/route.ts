/**
 * POST /api/admin/routes/[routeId]/refresh-directions
 *
 * 운영자가 게시 트리거 없이도 특정 라우트의 `routes.directions_meta`를 강제 갱신.
 * sample 라우트나 좌표 미세 변경 후 stale path가 의심될 때 사용.
 *
 * 인증: app_role = admin / super_admin만 통과.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { getDirectionsForCoords } from "@/lib/routing/directions-server";
import { simplifyPath } from "@/lib/routing/simplify-path";

async function isAdmin(): Promise<{ ok: false } | { ok: true; sb: NonNullable<Awaited<ReturnType<typeof getServerSupabaseForUser>>> }> {
  const sb = await getServerSupabaseForUser();
  if (!sb) return { ok: false };
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false };
  const { data } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  const role = data?.app_role;
  if (role !== "admin" && role !== "super_admin") return { ok: false };
  return { ok: true, sb };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_req: Request, ctx: { params: Promise<{ routeId: string }> }) {
  const { routeId } = await ctx.params;
  if (!UUID_RE.test(routeId)) {
    return NextResponse.json({ error: "routeId must be UUID" }, { status: 400 });
  }

  const gate = await isAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { sb } = gate;

  // 라우트에서 정렬된 spot_ids 가져오기.
  const { data: spotRows, error: spotsErr } = await sb
    .from("route_spots")
    .select("spot_id, sort_order")
    .eq("route_id", routeId)
    .order("sort_order", { ascending: true });
  if (spotsErr) {
    return NextResponse.json({ error: spotsErr.message }, { status: 500 });
  }
  if (!spotRows || spotRows.length < 2) {
    return NextResponse.json({ error: "route must have at least 2 spots" }, { status: 400 });
  }

  const spotIds = spotRows.map((r) => r.spot_id as string);
  const { data: catalog, error: catalogErr } = await sb
    .from("spot_catalog")
    .select("id, lat, lng")
    .in("id", spotIds);
  if (catalogErr) {
    return NextResponse.json({ error: catalogErr.message }, { status: 500 });
  }
  const coordById = new Map<string, { lat: number; lng: number }>();
  for (const row of catalog ?? []) {
    const lat = typeof row.lat === "number" ? row.lat : Number(row.lat);
    const lng = typeof row.lng === "number" ? row.lng : Number(row.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      coordById.set(row.id as string, { lat, lng });
    }
  }
  const orderedCoords = spotRows
    .map((r) => coordById.get(r.spot_id as string))
    .filter((c): c is { lat: number; lng: number } => c != null);

  if (orderedCoords.length < 2) {
    return NextResponse.json({ error: "could not resolve coords for spots" }, { status: 422 });
  }

  const directions = await getDirectionsForCoords(orderedCoords, "foot");
  if (!directions) {
    return NextResponse.json({ error: "directions provider failed (google + osrm)" }, { status: 502 });
  }

  const simplifiedPath = simplifyPath(directions.path);
  const payload = {
    provider: directions.provider,
    path: simplifiedPath,
    path_simplified_from:
      directions.path.length !== simplifiedPath.length ? directions.path.length : undefined,
    legs: directions.legs,
    distance_m: directions.distance_m,
    duration_s: directions.duration_s,
    computed_at: new Date().toISOString(),
  };

  const { error: updateErr } = await sb
    .from("routes")
    .update({ directions_meta: payload })
    .eq("id", routeId);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  for (const loc of ["ko", "en", "th", "vi"] as const) {
    revalidatePath(`/${loc}/routes/${routeId}`);
  }

  return NextResponse.json({
    ok: true,
    route_id: routeId,
    provider: directions.provider,
    points: simplifiedPath.length,
    points_original: directions.path.length,
    distance_m: directions.distance_m,
    duration_s: directions.duration_s,
    legs_count: directions.legs.length,
  });
}
