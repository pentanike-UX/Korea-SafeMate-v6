/**
 * Walking / driving geometry via public OSRM demo (no API key).
 * Production: point `OSRM_BASE_URL` at your own OSRM/Valhalla/ORS instance.
 */
export async function POST(req: Request) {
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

  const osrmProfile = profileRaw === "car" ? "driving" : "foot";
  const coordStr = coordinates.map((c) => `${c.lng},${c.lat}`).join(";");
  const base = process.env.OSRM_BASE_URL?.replace(/\/$/, "") ?? "https://router.project-osrm.org";
  const url = `${base}/route/v1/${osrmProfile}/${coordStr}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      return Response.json({ error: "Routing provider HTTP error", status: res.status }, { status: 502 });
    }
    const data = (await res.json()) as {
      code?: string;
      message?: string;
      routes?: { geometry?: { coordinates?: [number, number][] }; distance?: number; duration?: number }[];
    };
    if (data.code !== "Ok" || !data.routes?.[0]) {
      return Response.json({ error: data.message ?? "No route returned", code: data.code }, { status: 422 });
    }
    const route = data.routes[0];
    const coords = route.geometry?.coordinates;
    if (!coords?.length) {
      return Response.json({ error: "Empty geometry" }, { status: 422 });
    }
    const path = coords.map(([lng, lat]) => ({ lat, lng }));
    return Response.json({
      path,
      distance_m: route.distance ?? null,
      duration_s: route.duration ?? null,
      provider: "osrm",
      profile: osrmProfile,
    });
  } catch (e) {
    console.error("[routing/osrm]", e);
    return Response.json({ error: "Routing request failed" }, { status: 502 });
  }
}
