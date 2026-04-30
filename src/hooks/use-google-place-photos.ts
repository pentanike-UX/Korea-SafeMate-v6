"use client";

import { useEffect, useMemo, useState } from "react";
import type { ContentPost, RouteSpot } from "@/types/domain";
import { buildGoogleTextSearchQuery } from "@/lib/google-place-query";

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

/**
 * 유료 expanded + fetchRemote 시에만 호출 — Google Text Search → Details → photoUri(최대 10).
 * `spot.google.placeId`가 있으면 검색 생략.
 */
export function useGooglePlacePhotos(spot: RouteSpot | null, post: ContentPost, enabled: boolean) {
  const [photoUris, setPhotoUris] = useState<string[] | undefined>(undefined);
  const [done, setDone] = useState(false);

  const cacheKey = useMemo(() => {
    if (!spot) return "";
    return [
      post.id,
      spot.id,
      spot.google?.placeId ?? "",
      spot.real_place_name ?? "",
      spot.spot_name ?? "",
      spot.district ?? "",
      String(spot.lat),
      String(spot.lng),
      post.region_slug ?? "",
    ].join("|");
  }, [spot, post.id, post.region_slug]);

  useEffect(() => {
    if (!spot || !enabled) {
      setPhotoUris(undefined);
      setDone(false);
      return;
    }

    let cancelled = false;
    setDone(false);
    setPhotoUris(undefined);

    const s = spot;
    const p = post;

    async function run() {
      try {
        const presetPid = s.google?.placeId?.trim();
        let placeId = presetPid ? presetPid.replace(/^places\//, "") : "";

        if (!placeId) {
          const q = buildGoogleTextSearchQuery(s, p);
          if (q.length < 2) {
            if (!cancelled) {
              setPhotoUris([]);
              setDone(true);
            }
            return;
          }

          const sRes = await fetch("/api/google/places/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: q,
              region: "KR",
              lat: s.lat,
              lng: s.lng,
            }),
          });
          if (!sRes.ok) {
            if (!cancelled) {
              setPhotoUris([]);
              setDone(true);
            }
            return;
          }
          const sJson = (await sRes.json()) as {
            places?: Array<{ placeId: string; location: { lat: number; lng: number } }>;
          };
          const list = sJson.places ?? [];
          let pick = list[0];
          if (
            list.length > 1 &&
            Number.isFinite(s.lat) &&
            Number.isFinite(s.lng) &&
            !(s.lat === 0 && s.lng === 0)
          ) {
            let bestKm = Infinity;
            for (const pl of list) {
              const { lat: la, lng: ln } = pl.location ?? {};
              if (!Number.isFinite(la) || !Number.isFinite(ln)) continue;
              const d = haversineKm(s.lat, s.lng, la, ln);
              if (d < bestKm) {
                bestKm = d;
                pick = pl;
              }
            }
          }
          const pid = pick?.placeId?.trim();
          if (!pid) {
            if (!cancelled) {
              setPhotoUris([]);
              setDone(true);
            }
            return;
          }
          placeId = pid.replace(/^places\//, "");
        }

        const params = new URLSearchParams({
          placeId,
          resolvePhotos: "1",
        });
        const dRes = await fetch(`/api/google/places/details?${params.toString()}`);
        if (!dRes.ok) {
          if (!cancelled) {
            setPhotoUris([]);
            setDone(true);
          }
          return;
        }
        const dJson = (await dRes.json()) as { photoUris?: string[] };
        if (!cancelled) {
          setPhotoUris(Array.isArray(dJson.photoUris) ? dJson.photoUris : []);
        }
      } catch {
        if (!cancelled) setPhotoUris([]);
      } finally {
        if (!cancelled) setDone(true);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, cacheKey]);

  return { photoUris, googlePhotosDone: done };
}
