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
  photos: Array<{
    name: string;
    widthPx?: number;
    heightPx?: number;
    authorAttributions?: Array<{ displayName?: string; uri?: string; photoUri?: string }>;
  }>;
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
      "X-Goog-FieldMask":
        "places.name,places.displayName,places.formattedAddress,places.location,places.photos.name,places.photos.widthPx,places.photos.heightPx,places.photos.authorAttributions",
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
      photos?: Array<{
        name?: string;
        widthPx?: number;
        heightPx?: number;
        authorAttributions?: Array<{ displayName?: string; uri?: string; photoUri?: string }>;
      }>;
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
      photos: (p.photos ?? [])
        .map((ph) => ({
          name: ph.name?.trim() ?? "",
          widthPx: ph.widthPx,
          heightPx: ph.heightPx,
          authorAttributions: ph.authorAttributions,
        }))
        .filter((ph) => ph.name.length > 0),
    });
  }

  return { places: out };
}

export type GooglePlaceDetails = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  photos: Array<{
    name: string;
    widthPx?: number;
    heightPx?: number;
    authorAttributions?: Array<{ displayName?: string; uri?: string; photoUri?: string }>;
  }>;
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
      "X-Goog-FieldMask":
        "name,displayName,formattedAddress,location,photos.name,photos.widthPx,photos.heightPx,photos.authorAttributions",
    },
  });

  const json = (await res.json()) as {
    name?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    photos?: Array<{
      name?: string;
      widthPx?: number;
      heightPx?: number;
      authorAttributions?: Array<{ displayName?: string; uri?: string; photoUri?: string }>;
    }>;
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
      authorAttributions: ph.authorAttributions,
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
const MIN_PHOTO_PX = 160;
const MAX_PHOTO_PX_HARD = 4800;

export type GooglePlaceResolvedPhoto = {
  name: string;
  url: string;
  width?: number;
  height?: number;
  authorAttributions?: Array<{ displayName?: string; uri?: string; photoUri?: string }>;
};

/**
 * Places Photo media — 리다이렉트 Location 또는 동일 응답 URL.
 * 최종 URL은 보통 API 키 없이 GET 가능한 googleusercontent 호스트.
 * `name`은 API가 준 전체 리소스 경로 (예: `places/ChIJ…/photos/AciIO…`).
 */
export async function resolveGooglePhotoMedia(
  photoResourceName: string,
  opts?: { maxWidthPx?: number; authorAttributions?: Array<{ displayName?: string; uri?: string; photoUri?: string }> },
): Promise<GooglePlaceResolvedPhoto | null> {
  const key = getGoogleMapsServerApiKey();
  const name = photoResourceName.trim();
  if (!key || !name) return null;

  const pxRaw = Number.isFinite(opts?.maxWidthPx) ? (opts?.maxWidthPx as number) : MAX_PHOTO_PX;
  const maxWidthPx = Math.max(MIN_PHOTO_PX, Math.min(MAX_PHOTO_PX_HARD, Math.round(pxRaw)));
  const mediaUrl = `${PLACES_BASE}/${name}/media?maxWidthPx=${maxWidthPx}&skipHttpRedirect=true&key=${encodeURIComponent(key)}`;

  const res = await fetch(mediaUrl);
  const json = (await res.json().catch(() => null)) as
    | {
        name?: string;
        photoUri?: string;
        widthPx?: number;
        heightPx?: number;
        error?: { message?: string };
      }
    | null;

  if (!res.ok) return null;
  const url = json?.photoUri?.trim();
  if (!url?.startsWith("http")) return null;
  return {
    name,
    url,
    width: json?.widthPx,
    height: json?.heightPx,
    authorAttributions: opts?.authorAttributions,
  };
}

export async function resolveGooglePhotoUri(photoResourceName: string): Promise<string | null> {
  const resolved = await resolveGooglePhotoMedia(photoResourceName);
  return resolved?.url ?? null;
}

/** 최대 `max`장까지 병렬 resolve (과도한 동시성 방지 — 청크). */
export async function resolveGooglePhotoUris(
  photos: Array<{ name: string; authorAttributions?: Array<{ displayName?: string; uri?: string; photoUri?: string }> }>,
  max: number,
): Promise<string[]> {
  const resolved = await resolveGooglePhotoMediaBatch(photos, max);
  return resolved.map((p) => p.url);
}

/** 최대 `max`장까지 병렬 resolve (과도한 동시성 방지 — 청크). */
export async function resolveGooglePhotoMediaBatch(
  photos: Array<{ name: string; authorAttributions?: Array<{ displayName?: string; uri?: string; photoUri?: string }> }>,
  max: number,
): Promise<GooglePlaceResolvedPhoto[]> {
  const slice = photos.slice(0, max);
  const out: GooglePlaceResolvedPhoto[] = [];
  const chunk = 3;
  for (let i = 0; i < slice.length; i += chunk) {
    const batch = slice.slice(i, i + chunk);
    const media = await Promise.all(
      batch.map((p) => resolveGooglePhotoMedia(p.name, { authorAttributions: p.authorAttributions })),
    );
    for (const m of media) {
      if (m) out.push(m);
    }
  }
  return out;
}
