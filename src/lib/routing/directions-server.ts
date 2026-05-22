/**
 * 서버 전용 — Google Directions(우선) / OSRM(폴백) 폴리라인 + 구간 정보 계산.
 *
 * 응답을 `fetch({ next: { revalidate } })`로 Vercel Runtime Cache에 보관해
 * 같은 좌표 집합에 대해 페이지 진입마다 외부 호출이 발생하지 않게 한다.
 *
 * 클라이언트는 `HaruRouteMapView`에 결과를 prop으로 받아 자체 fetch를 생략한다.
 */

import "server-only";

type LatLng = { lat: number; lng: number };
export type RoutingProfile = "foot" | "car";

export interface RoutingLeg {
  distance_m: number | null;
  duration_s: number | null;
}

export interface RoutingResult {
  path: LatLng[];
  legs: RoutingLeg[];
  distance_m: number | null;
  duration_s: number | null;
  provider: "google" | "osrm";
}

/** Google 인코딩 폴리라인 디코더 — `/api/routing/google`과 동일 알고리즘. */
function decodePolyline(encoded: string): LatLng[] {
  const out: LatLng[] = [];
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

const REVALIDATE_SECONDS = 60 * 60 * 24; // 24h

async function tryGoogle(coords: LatLng[], profile: RoutingProfile): Promise<RoutingResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey || coords.length < 2) return null;

  const mode = profile === "car" ? "driving" : "walking";
  const origin = coords[0];
  const destination = coords[coords.length - 1];
  const waypoints = coords.slice(1, -1);
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
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      routes?: {
        overview_polyline?: { points?: string };
        legs?: { distance?: { value?: number }; duration?: { value?: number } }[];
      }[];
    };
    if (data.status !== "OK" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    const encoded = route.overview_polyline?.points;
    if (!encoded) return null;
    const path = decodePolyline(encoded);
    const legs = (route.legs ?? []).map<RoutingLeg>((leg) => ({
      distance_m: leg.distance?.value ?? null,
      duration_s: leg.duration?.value ?? null,
    }));
    const distance_m = legs.reduce((sum, l) => sum + (l.distance_m ?? 0), 0) || null;
    const duration_s = legs.reduce((sum, l) => sum + (l.duration_s ?? 0), 0) || null;
    return { path, legs, distance_m, duration_s, provider: "google" };
  } catch (e) {
    console.warn("[directions-server] google failed", e);
    return null;
  }
}

async function tryOsrm(coords: LatLng[], profile: RoutingProfile): Promise<RoutingResult | null> {
  if (coords.length < 2) return null;
  const osrmProfile = profile === "car" ? "driving" : "foot";
  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  const base = process.env.OSRM_BASE_URL?.replace(/\/$/, "") ?? "https://router.project-osrm.org";
  const url = `${base}/route/v1/${osrmProfile}/${coordStr}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: string;
      routes?: {
        geometry?: { coordinates?: [number, number][] };
        distance?: number;
        duration?: number;
        legs?: { distance?: number; duration?: number }[];
      }[];
    };
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    const coordsArr = route.geometry?.coordinates;
    if (!coordsArr?.length) return null;
    const path = coordsArr.map(([lng, lat]) => ({ lat, lng }));
    const legs = (route.legs ?? []).map<RoutingLeg>((leg) => ({
      distance_m: typeof leg.distance === "number" ? leg.distance : null,
      duration_s: typeof leg.duration === "number" ? leg.duration : null,
    }));
    return {
      path,
      legs,
      distance_m: route.distance ?? null,
      duration_s: route.duration ?? null,
      provider: "osrm",
    };
  } catch (e) {
    console.warn("[directions-server] osrm failed", e);
    return null;
  }
}

/**
 * 좌표 배열에 대해 Google → OSRM 순서로 시도, 둘 다 실패하면 null.
 * `fetch` 캐시 키는 URL 전체이므로 동일 좌표·프로파일은 24h 동안 외부 호출 1회.
 */
export async function getDirectionsForCoords(
  coords: LatLng[],
  profile: RoutingProfile = "foot",
): Promise<RoutingResult | null> {
  if (coords.length < 2) return null;
  const google = await tryGoogle(coords, profile);
  if (google) return google;
  return tryOsrm(coords, profile);
}
