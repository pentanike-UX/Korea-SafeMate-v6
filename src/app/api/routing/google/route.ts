/**
 * Google Directions API 라우팅 — 서버 전용 `GOOGLE_MAPS_API_KEY` 사용.
 * 응답 셰이프는 `/api/routing/osrm`과 호환 (`path`, `distance_m`, `duration_s`) +
 * 구간별 정보 `legs[]` 포함.
 *
 * 키 미설정 시 503 — 호출 측은 OSRM으로 폴백할 수 있다.
 */

/** Google 인코딩 폴리라인 디코더 — 표준 알고리즘. */
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const out: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    out.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
  }
  return out;
}

interface DirectionsLeg {
  distance?: { value?: number };
  duration?: { value?: number };
}
interface DirectionsRoute {
  overview_polyline?: { points?: string };
  legs?: DirectionsLeg[];
}
interface DirectionsResponse {
  status?: string;
  error_message?: string;
  routes?: DirectionsRoute[];
}

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_MAPS_API_KEY not configured", retry_with: "osrm" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const coordinates = (body as { coordinates?: { lat: number; lng: number }[] }).coordinates;
  const profileRaw = (body as { profile?: string }).profile ?? "foot";
  if (!coordinates || coordinates.length < 2) {
    return Response.json({ error: "At least two coordinates required" }, { status: 400 });
  }

  // Google Directions: mode=walking|driving|bicycling|transit
  const mode = profileRaw === "car" ? "driving" : "walking";
  const origin = coordinates[0];
  const destination = coordinates[coordinates.length - 1];
  const waypoints = coordinates.slice(1, -1);

  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode,
    language: "ko",
    region: "kr",
    key: apiKey,
  });
  if (waypoints.length > 0) {
    params.set("waypoints", waypoints.map((w) => `${w.lat},${w.lng}`).join("|"));
  }

  const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      return Response.json({ error: "Directions HTTP error", status: res.status }, { status: 502 });
    }
    const data = (await res.json()) as DirectionsResponse;
    if (data.status !== "OK" || !data.routes?.[0]) {
      return Response.json(
        { error: data.error_message ?? data.status ?? "No route returned" },
        { status: 422 },
      );
    }
    const route = data.routes[0];
    const encoded = route.overview_polyline?.points;
    if (!encoded) {
      return Response.json({ error: "Empty geometry" }, { status: 422 });
    }
    const path = decodePolyline(encoded);

    const legs = (route.legs ?? []).map((leg) => ({
      distance_m: leg.distance?.value ?? null,
      duration_s: leg.duration?.value ?? null,
    }));
    const totalDistance = legs.reduce((sum, l) => sum + (l.distance_m ?? 0), 0);
    const totalDuration = legs.reduce((sum, l) => sum + (l.duration_s ?? 0), 0);

    return Response.json({
      path,
      distance_m: totalDistance || null,
      duration_s: totalDuration || null,
      legs,
      provider: "google",
      profile: mode,
    });
  } catch (e) {
    console.error("[routing/google]", e);
    return Response.json({ error: "Directions request failed" }, { status: 502 });
  }
}
