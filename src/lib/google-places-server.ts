/**
 * Google Places API (New) — 서버 전용. `GOOGLE_MAPS_API_KEY`만 사용.
 * 브라우저 번들에 키를 넣지 않는다.
 */

const PLACES_BASE = "https://places.googleapis.com/v1";

export function getGoogleMapsServerApiKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

/** `ChIJ…` 또는 `places/ChIJ…` → Details 경로용 place id (슬래시 없음) */
export function normalizeGooglePlaceId(raw: string): string {
  const s = raw.trim();
  if (s.startsWith("places/")) return s.slice("places/".length);
  return s;
}

export type GoogleTextSearchPlace = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
};

export async function googlePlacesSearchText(body: {
  textQuery: string;
  regionCode?: string;
  languageCode?: string;
  pageSize?: number;
  locationBias?: {
    circle: { center: { latitude: number; longitude: number }; radius: number };
  };
}): Promise<{ places: GoogleTextSearchPlace[]; rawError?: string }> {
  const key = getGoogleMapsServerApiKey();
  if (!key) return { places: [], rawError: "missing_api_key" };

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.name,places.displayName,places.formattedAddress,places.location",
    },
    body: JSON.stringify({
      textQuery: body.textQuery,
      regionCode: body.regionCode ?? "KR",
      languageCode: body.languageCode ?? "ko",
      pageSize: Math.min(body.pageSize ?? 8, 20),
      ...(body.locationBias ? { locationBias: body.locationBias } : {}),
    }),
  });

  const json = (await res.json()) as {
    places?: Array<{
      name?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
    }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    return {
      places: [],
      rawError: json?.error?.message ?? `http_${res.status}`,
    };
  }

  const out: GoogleTextSearchPlace[] = [];
  for (const p of json.places ?? []) {
    const name = p.name?.trim();
    if (!name?.startsWith("places/")) continue;
    const placeId = name.replace(/^places\//, "");
    const lat = p.location?.latitude;
    const lng = p.location?.longitude;
    out.push({
      placeId,
      displayName: p.displayName?.text?.trim() ?? "",
      formattedAddress: p.formattedAddress?.trim() ?? "",
      location: {
        lat: typeof lat === "number" ? lat : 0,
        lng: typeof lng === "number" ? lng : 0,
      },
    });
  }

  return { places: out };
}

export type GooglePlaceDetails = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  photos: Array<{ name: string; widthPx?: number; heightPx?: number }>;
};

export async function googlePlaceDetails(placeIdRaw: string): Promise<{
  details: GooglePlaceDetails | null;
  rawError?: string;
}> {
  const key = getGoogleMapsServerApiKey();
  if (!key) return { details: null, rawError: "missing_api_key" };

  const id = normalizeGooglePlaceId(placeIdRaw);
  const url = `${PLACES_BASE}/places/${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "name,displayName,formattedAddress,location,photos",
    },
  });

  const json = (await res.json()) as {
    name?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    photos?: Array<{ name?: string; widthPx?: number; heightPx?: number }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    return { details: null, rawError: json?.error?.message ?? `http_${res.status}` };
  }

  const name = json.name?.trim();
  const pid = name?.startsWith("places/") ? name.replace(/^places\//, "") : id;
  const lat = json.location?.latitude;
  const lng = json.location?.longitude;

  const photos = (json.photos ?? [])
    .map((ph) => ({
      name: ph.name?.trim() ?? "",
      widthPx: ph.widthPx,
      heightPx: ph.heightPx,
    }))
    .filter((ph) => ph.name.length > 0);

  return {
    details: {
      placeId: pid,
      displayName: json.displayName?.text?.trim() ?? "",
      formattedAddress: json.formattedAddress?.trim() ?? "",
      location: {
        lat: typeof lat === "number" ? lat : 0,
        lng: typeof lng === "number" ? lng : 0,
      },
      photos,
    },
  };
}

const MAX_PHOTO_PX = 1600;

/**
 * Places Photo media — 리다이렉트 Location 또는 동일 응답 URL.
 * 최종 URL은 보통 API 키 없이 GET 가능한 googleusercontent 호스트.
 * `name`은 API가 준 전체 리소스 경로 (예: `places/ChIJ…/photos/AciIO…`).
 */
export async function resolveGooglePhotoUri(photoResourceName: string): Promise<string | null> {
  const key = getGoogleMapsServerApiKey();
  const name = photoResourceName.trim();
  if (!key || !name) return null;

  const mediaUrl = `${PLACES_BASE}/${name}/media?maxWidthPx=${MAX_PHOTO_PX}`;

  const res = await fetch(mediaUrl, {
    headers: { "X-Goog-Api-Key": key },
    redirect: "manual",
  });

  if (res.status === 301 || res.status === 302 || res.status === 303 || res.status === 307 || res.status === 308) {
    const loc = res.headers.get("Location");
    if (loc?.startsWith("http")) return loc;
  }

  if (res.ok && res.headers.get("content-type")?.startsWith("image/")) {
    return mediaUrl;
  }

  return null;
}

/** 최대 `max`장까지 병렬 resolve (과도한 동시성 방지 — 청크). */
export async function resolveGooglePhotoUris(
  photos: Array<{ name: string }>,
  max: number,
): Promise<string[]> {
  const slice = photos.slice(0, max);
  const out: string[] = [];
  const chunk = 3;
  for (let i = 0; i < slice.length; i += chunk) {
    const batch = slice.slice(i, i + chunk);
    const urls = await Promise.all(batch.map((p) => resolveGooglePhotoUri(p.name)));
    for (const u of urls) {
      if (u) out.push(u);
    }
  }
  return out;
}
