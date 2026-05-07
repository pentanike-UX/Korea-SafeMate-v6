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
    // place details는 자주 바뀌지 않음 — 1시간 캐시
    next: { revalidate: 3600 },
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
 * Place Photo (New) getMedia — `X-Goog-Api-Key`(및 폴백으로 query `key`).
 * `skipHttpRedirect=true` → JSON { photoUri }. 생략 시 302 + Location(이미지).
 * `photoUri` 는 단기 URL — `<img>` 또는 `/api/image-proxy` 로 소비.
 * `name`: `places/.../photos/...` (API가 준 `photos.name` 전체).
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
  const path = name.replace(/^\/+/, "");
  const base = `${PLACES_BASE}/${path}/media`;
  const search = new URLSearchParams({
    maxWidthPx: String(maxWidthPx),
    skipHttpRedirect: "true",
  });

  const commonHeaders: Record<string, string> = {
    Accept: "application/json",
    "X-Goog-Api-Key": key,
  };

  /**
   * skipHttpRedirect=true 시도 → JSON { photoUri } 기대.
   * 일부 환경에서 302 redirect로 응답할 수 있어 양쪽 처리.
   * next.revalidate: 3600 — Vercel Data Cache에서 1시간 캐시 (GET이므로 캐시 가능).
   */
  async function tryOnce(url: string, headers: Record<string, string>): Promise<GooglePlaceResolvedPhoto | null> {
    const res = await fetch(url, {
      headers,
      redirect: "manual",
      // GET 요청이므로 Next.js Data Cache 적용 가능 (Vercel 환경)
      next: { revalidate: 3600 },
    });

    // 302 redirect → Location 헤더가 실제 이미지 URL
    if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
      const loc = res.headers.get("location")?.trim();
      if (loc?.startsWith("http")) {
        return { name, url: loc, authorAttributions: opts?.authorAttributions };
      }
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      const preview = errBody.slice(0, 320);
      console.warn("[google-places] photo_media_http_error", {
        status: res.status,
        photoName: name.slice(0, 80),
        bodyPreview: preview,
      });
      return null;
    }

    const ct = res.headers.get("content-type") ?? "";

    // skipHttpRedirect=true 성공 시 JSON 응답
    if (/json/i.test(ct)) {
      const json = (await res.json().catch(() => null)) as
        | {
            name?: string;
            photoUri?: string;
            widthPx?: number;
            heightPx?: number;
            error?: { message?: string; status?: string };
          }
        | null;
      const errMsg = json?.error?.message ?? json?.error?.status;
      if (errMsg) {
        console.warn("[google-places] photo_media_api_error", {
          message: errMsg,
          photoName: name.slice(0, 80),
        });
        return null;
      }
      const urlOut = json?.photoUri?.trim();
      if (!urlOut?.startsWith("http")) {
        console.warn("[google-places] photo_media_no_uri", {
          photoName: name.slice(0, 80),
          jsonKeys: json ? Object.keys(json).join(",") : "null",
        });
        return null;
      }
      return {
        name,
        url: urlOut,
        width: json?.widthPx,
        height: json?.heightPx,
        authorAttributions: opts?.authorAttributions,
      };
    }

    // 200 OK + 이미지 binary로 직접 응답하는 경우 (일부 버전)
    if (ct.startsWith("image/")) {
      // 직접 이미지 URL 반환 불가 — 요청 URL 자체를 반환
      return { name, url: url, authorAttributions: opts?.authorAttributions };
    }

    console.warn("[google-places] photo_media_unexpected_type", {
      contentType: ct,
      photoName: name.slice(0, 80),
    });
    return null;
  }

  // 1차 시도: 헤더에만 API 키
  const urlHeaderOnly = `${base}?${search.toString()}`;
  const resolved = await tryOnce(urlHeaderOnly, commonHeaders);
  if (resolved) return resolved;

  // 2차 시도: query string에도 key 추가 (일부 GCP 프로젝트 설정에서 필요)
  const q2 = new URLSearchParams(search);
  q2.set("key", key);
  const urlWithQueryKey = `${base}?${q2.toString()}`;
  return tryOnce(urlWithQueryKey, commonHeaders);
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
