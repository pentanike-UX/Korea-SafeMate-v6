#!/usr/bin/env node
/**
 * mock/sample 라우트의 directions를 빌드 타임에 한 번 계산해 정적 JSON에 저장.
 * 페이지가 외부 API 호출 없이 즉시 폴리라인·구간 정보를 사용할 수 있게 한다.
 *
 * 사용:
 *   GOOGLE_MAPS_API_KEY=… node scripts/build-mock-directions.mjs
 *
 * 키가 없거나 API가 실패하면 OSRM 공개 서버로 폴백한다. 산출물은
 * src/data/mock/haru-route-directions.json — 페이지가 mock 라우트일 때 우선 사용.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/data/mock/haru-route-directions.json");
const SOURCE = path.join(ROOT, "src/data/mock/haru-route.ts");

// ── mock 파일에서 catalog.lat/lng를 추출 (mockHaruRoute.spots[].catalog.{lat,lng}) ──
function extractMockCoords() {
  const src = fs.readFileSync(SOURCE, "utf8");
  const coords = [];
  const re = /catalog:\s*\{[^}]*?lat:\s*([0-9.]+)[^}]*?lng:\s*([0-9.]+)/gs;
  let m;
  while ((m = re.exec(src)) !== null) {
    coords.push({ lat: Number(m[1]), lng: Number(m[2]) });
  }
  return coords;
}

function decodePolyline(encoded) {
  const out = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;
    out.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
  }
  return out;
}

async function tryGoogle(coords) {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key || coords.length < 2) return null;
  const origin = coords[0];
  const destination = coords[coords.length - 1];
  const waypoints = coords.slice(1, -1);
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: "walking",
    language: "ko",
    region: "kr",
    key,
  });
  if (waypoints.length > 0) {
    params.set("waypoints", waypoints.map((w) => `${w.lat},${w.lng}`).join("|"));
  }
  const url = `https://maps.googleapis.com/maps/api/directions/json?${params}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== "OK" || !data.routes?.[0]) return null;
  const r = data.routes[0];
  const path = decodePolyline(r.overview_polyline?.points ?? "");
  const legs = (r.legs ?? []).map((l) => ({
    distance_m: l.distance?.value ?? null,
    duration_s: l.duration?.value ?? null,
  }));
  const distance_m = legs.reduce((s, l) => s + (l.distance_m ?? 0), 0) || null;
  const duration_s = legs.reduce((s, l) => s + (l.duration_s ?? 0), 0) || null;
  return { provider: "google", path, legs, distance_m, duration_s };
}

async function tryOsrm(coords) {
  if (coords.length < 2) return null;
  const base = process.env.OSRM_BASE_URL?.replace(/\/$/, "") || "https://router.project-osrm.org";
  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  const url = `${base}/route/v1/foot/${coordStr}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.[0]) return null;
  const r = data.routes[0];
  const path = (r.geometry?.coordinates ?? []).map(([lng, lat]) => ({ lat, lng }));
  if (path.length === 0) return null;
  const legs = (r.legs ?? []).map((l) => ({
    distance_m: typeof l.distance === "number" ? l.distance : null,
    duration_s: typeof l.duration === "number" ? l.duration : null,
  }));
  return {
    provider: "osrm",
    path,
    legs,
    distance_m: r.distance ?? null,
    duration_s: r.duration ?? null,
  };
}

async function main() {
  const coords = extractMockCoords();
  if (coords.length < 2) {
    console.warn(`[build-mock-directions] coords not found in ${SOURCE} — wrote empty {}`);
    fs.writeFileSync(OUT, "{}\n");
    return;
  }
  console.log(`[build-mock-directions] ${coords.length} spots`);

  let result = await tryGoogle(coords);
  if (!result) result = await tryOsrm(coords);
  if (!result) {
    console.warn(`[build-mock-directions] Google/OSRM both failed — leaving JSON empty`);
    fs.writeFileSync(OUT, "{}\n");
    return;
  }

  const payload = {
    "mock-haru-route": {
      ...result,
      computed_at: new Date().toISOString(),
    },
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`[build-mock-directions] wrote ${OUT} (provider=${result.provider}, points=${result.path.length})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
