/**
 * Directions 캐시 헬스 디버그 — 운영자가 Vercel 대시보드 없이도
 * Google/OSRM 응답 가용성과 캐시 적중 여부의 근사값을 확인할 수 있게 한다.
 *
 * 동작:
 * - 고정 디버그 좌표(서울 시청 → 광화문 → 인사동)에 대해 directions-server를
 *   두 번 연속 호출한 latency를 비교.
 *   1차: cold 또는 cache hit (24h 캐시가 살아있으면 hit)
 *   2차: 거의 확실히 cache hit (동일 URL 재요청 → Vercel Runtime Cache)
 * - 2차가 1차보다 현저히 빠르면(예: <50ms) cache가 작동 중일 가능성 ↑.
 *
 * **운영 노트:** 이 엔드포인트는 외부 호출이 발생하므로 인덱싱·정기 헬스 체크는
 * 부담스러울 수 있다. CI/관리자 수동 디버그 용도로 한정.
 */
import { getDirectionsForCoords } from "@/lib/routing/directions-server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

// 서울 시청·광화문·인사동 — 워크 가능한 짧은 거리
const DEBUG_COORDS = [
  { lat: 37.5664, lng: 126.9779 }, // 시청
  { lat: 37.5759, lng: 126.9769 }, // 광화문
  { lat: 37.5733, lng: 126.9853 }, // 인사동
];

async function isAdmin(): Promise<boolean> {
  const sb = await getServerSupabaseForUser();
  if (!sb) return false;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  return data?.app_role === "admin" || data?.app_role === "super_admin";
}

export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const apiKeyConfigured = Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());
  const osrmBase = process.env.OSRM_BASE_URL?.trim() || "(default public demo)";

  const t1Start = performance.now();
  const first = await getDirectionsForCoords(DEBUG_COORDS, "foot");
  const t1Ms = Math.round(performance.now() - t1Start);

  const t2Start = performance.now();
  const second = await getDirectionsForCoords(DEBUG_COORDS, "foot");
  const t2Ms = Math.round(performance.now() - t2Start);

  // 2차 호출의 latency가 1차보다 명확히 빠르면(>= 4배) cache hit으로 추정.
  const cacheLikelyHot = t2Ms > 0 && t1Ms / Math.max(1, t2Ms) >= 4;

  return Response.json(
    {
      ok: first != null,
      env: {
        google_api_key_configured: apiKeyConfigured,
        osrm_base_url: osrmBase,
      },
      probe: {
        coords_count: DEBUG_COORDS.length,
        first_call_ms: t1Ms,
        second_call_ms: t2Ms,
        cache_likely_hot: cacheLikelyHot,
        provider: first?.provider ?? null,
        distance_m: first?.distance_m ?? null,
        duration_s: first?.duration_s ?? null,
        legs_count: first?.legs.length ?? 0,
      },
      second_match: {
        provider: second?.provider ?? null,
        distance_matches: first?.distance_m === second?.distance_m,
        duration_matches: first?.duration_s === second?.duration_s,
      },
    },
    {
      // 디버그 엔드포인트는 자체 캐시 금지 — 매 호출마다 새 측정.
      headers: { "Cache-Control": "no-store" },
    },
  );
}
