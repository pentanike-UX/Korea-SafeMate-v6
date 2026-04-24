/**
 * Default: OpenFreeMap (OSM-based, no API key). Good for dev + MVP worldwide including Korea.
 * Override with NEXT_PUBLIC_MAP_STYLE_URL — e.g. MapTiler, Mapbox, or Naver Static (separate integration).
 *
 * Naver / Kakao: official JS SDKs need app keys + domain allowlist; not bundled here.
 * MapLibre + OSM/OpenFreeMap is the zero-key path that still shows real streets.
 */
export const DEFAULT_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export function getMapStyleUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_MAP_STYLE_URL;
}
