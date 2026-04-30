import { NextResponse } from "next/server";
import { z } from "zod";
import { googlePlacesSearchText } from "@/lib/google-places-server";

const bodySchema = z.object({
  query: z.string().min(1).max(200),
  region: z.string().max(4).optional(),
  lat: z.number().finite().optional(),
  lng: z.number().finite().optional(),
  realPlaceName: z.string().max(120).optional(),
});

/**
 * POST — Text Search (New). `{ places: [{ placeId, displayName, formattedAddress, location }] }`
 * 서버 환경변수 `GOOGLE_MAPS_API_KEY`만 사용 (클라이언트 비노출).
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { query, region, lat, lng, realPlaceName } = parsed.data;
  const locationBias =
    typeof lat === "number" && typeof lng === "number"
      ? {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 5000,
          },
        }
      : undefined;

  const { places, rawError } = await googlePlacesSearchText({
    textQuery: query,
    regionCode: region ?? "KR",
    pageSize: 8,
    locationBias,
  });

  if (rawError === "missing_api_key") {
    return NextResponse.json({ error: "server_misconfigured", places: [] }, { status: 503 });
  }

  console.info("[google-places-search] query", {
    placeQuery: query,
    realPlaceName: realPlaceName ?? null,
    region: region ?? "KR",
    resultCount: places.length,
    firstPlaceId: places[0]?.placeId ?? null,
    firstDisplayName: places[0]?.displayName ?? null,
    firstPhotosCount: places[0]?.photos?.length ?? 0,
    warning: rawError ?? null,
  });

  return NextResponse.json({ places, warning: rawError });
}
