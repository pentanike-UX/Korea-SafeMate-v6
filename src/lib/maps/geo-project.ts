import type { MapLatLng } from "@/types/domain";

export type LatLngBounds = { minLat: number; maxLat: number; minLng: number; maxLng: number };

const FALLBACK: MapLatLng = { lat: 37.5665, lng: 126.978 };

function expandBounds(bounds: LatLngBounds, paddingRatio = 0.14): LatLngBounds {
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.0009);
  const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.0009);
  const plat = latSpan * paddingRatio;
  const plng = lngSpan * paddingRatio;
  return {
    minLat: bounds.minLat - plat,
    maxLat: bounds.maxLat + plat,
    minLng: bounds.minLng - plng,
    maxLng: bounds.maxLng + plng,
  };
}

export function boundsFromPoints(points: MapLatLng[]): LatLngBounds {
  if (points.length === 0) {
    return expandBounds({
      minLat: FALLBACK.lat,
      maxLat: FALLBACK.lat,
      minLng: FALLBACK.lng,
      maxLng: FALLBACK.lng,
    });
  }
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return expandBounds({
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  });
}

/** Normalized 0–100 space; y grows downward like SVG. */
export function projectToUnitSquare(lat: number, lng: number, b: LatLngBounds): { x: number; y: number } {
  const x = ((lng - b.minLng) / (b.maxLng - b.minLng)) * 100;
  const y = (1 - (lat - b.minLat) / (b.maxLat - b.minLat)) * 100;
  return { x, y };
}
