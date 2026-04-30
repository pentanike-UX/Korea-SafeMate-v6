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

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

function uniqueTokens(parts: Array<string | undefined>): string[] {
  return [...new Set(parts.map((x) => x?.trim()).filter((x): x is string => Boolean(x && x.length > 0)))];
}

function placeQueryOverride(spot: RouteSpot): { query?: string; tokens: string[] } {
  const raw = [spot.real_place_name, spot.spot_name, spot.display_name, spot.place_name, spot.title].join(" ").trim();
  if (!raw) return { tokens: [] };
  if (/광화문광장.*이순신|이순신.*광화문/.test(raw)) {
    return {
      query: "Statue of Admiral Yi Sun-sin Gwanghwamun Square Seoul",
      tokens: ["이순신", "Admiral Yi", "Yi Sun-sin", "Gwanghwamun"],
    };
  }
  if (/광화문광장.*세종|세종.*광화문/.test(raw)) {
    return {
      query: "Statue of King Sejong Gwanghwamun Square Seoul",
      tokens: ["세종", "King Sejong", "Gwanghwamun"],
    };
  }
  if (/경복궁.*광화문|광화문.*경복궁/.test(raw)) {
    return {
      query: "Gwanghwamun Gate Gyeongbokgung Palace Seoul",
      tokens: ["경복궁", "광화문", "Gwanghwamun Gate", "Gyeongbokgung"],
    };
  }
  if (/광화문광장/.test(raw)) {
    return {
      query: "Gwanghwamun Square Seoul",
      tokens: ["광화문광장", "Gwanghwamun Square"],
    };
  }
  return { tokens: [] };
}

function pickBestPlace(
  list: Array<{ placeId: string; displayName: string; formattedAddress: string; location: { lat: number; lng: number } }>,
  spot: RouteSpot,
  extraTokens: string[],
) {
  if (list.length === 0) return undefined;
  const spotLatValid = Number.isFinite(spot.lat) && Number.isFinite(spot.lng) && !(spot.lat === 0 && spot.lng === 0);
  const tokens = uniqueTokens([
    ...extraTokens,
    spot.real_place_name,
    spot.spot_name,
    spot.display_name,
    spot.place_name,
    spot.title,
    spot.district,
  ]).map(norm);
  let best = list[0];
  let bestScore = -Infinity;
  for (const pl of list) {
    const dn = norm(pl.displayName ?? "");
    const ad = norm(pl.formattedAddress ?? "");
    let score = 0;
    for (const tk of tokens) {
      if (!tk) continue;
      if (dn.includes(tk)) score += 8;
      if (ad.includes(tk)) score += 4;
    }
    if (spotLatValid && Number.isFinite(pl.location?.lat) && Number.isFinite(pl.location?.lng)) {
      const d = haversineKm(spot.lat, spot.lng, pl.location.lat, pl.location.lng);
      score += Math.max(0, 3 - Math.min(3, d));
    }
    if (score > bestScore) {
      bestScore = score;
      best = pl;
    }
  }
  return best;
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
        const spotLabel = s.real_place_name?.trim() || s.spot_name?.trim() || s.title?.trim() || s.id;
        const presetPid = s.google?.placeId?.trim();
        let placeId = presetPid ? presetPid.replace(/^places\//, "") : "";
        const override = placeQueryOverride(s);

        if (!placeId) {
          const q = override.query ?? buildGoogleTextSearchQuery(s, p);
          if (q.length < 2) {
            if (!cancelled) {
              setPhotoUris([]);
              setDone(true);
            }
            console.info("[google-place-photos:client] skipped_query_too_short", { spotLabel, query: q });
            return;
          }

          const sRes = await fetch("/api/google/places/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: q,
              realPlaceName: s.real_place_name ?? undefined,
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
            console.info("[google-place-photos:client] search_failed", {
              spotLabel,
              query: q,
              status: sRes.status,
            });
            return;
          }
          const sJson = (await sRes.json()) as {
            places?: Array<{
              placeId: string;
              displayName: string;
              formattedAddress: string;
              location: { lat: number; lng: number };
            }>;
          };
          const list = sJson.places ?? [];
          const pick = pickBestPlace(list, s, override.tokens);
          const pid = pick?.placeId?.trim();
          if (!pid) {
            if (!cancelled) {
              setPhotoUris([]);
              setDone(true);
            }
            console.info("[google-place-photos:client] no_place_match", {
              spotLabel,
              query: q,
              resultCount: list.length,
            });
            return;
          }
          placeId = pid.replace(/^places\//, "");
          console.info("[google-place-photos:client] place_resolved", {
            spotLabel,
            query: q,
            placeId,
            displayName: pick?.displayName ?? null,
          });
        }

        const params = new URLSearchParams({
          placeId,
          resolvePhotos: "1",
          placeQuery: override.query ?? buildGoogleTextSearchQuery(s, p),
          spotLabel,
        });
        const dRes = await fetch(`/api/google/places/details?${params.toString()}`);
        if (!dRes.ok) {
          if (!cancelled) {
            setPhotoUris([]);
            setDone(true);
          }
          console.info("[google-place-photos:client] details_failed", {
            spotLabel,
            placeId,
            status: dRes.status,
          });
          return;
        }
        const dJson = (await dRes.json()) as {
          photoUris?: string[];
          photoFallbackReason?: string | null;
        };
        const resolvedUris = Array.isArray(dJson.photoUris) ? dJson.photoUris : [];
        if (!cancelled) {
          setPhotoUris(resolvedUris);
        }
        console.info("[google-place-photos:client] photos_resolved", {
          spotLabel,
          placeId,
          count: resolvedUris.length,
          firstPhotoUri: resolvedUris[0] ?? null,
          photoFallbackReason: dJson.photoFallbackReason ?? null,
        });
      } catch {
        if (!cancelled) setPhotoUris([]);
        console.info("[google-place-photos:client] photos_failed_exception", {
          spotLabel: s.real_place_name?.trim() || s.spot_name?.trim() || s.id,
        });
      } finally {
        if (!cancelled) setDone(true);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, cacheKey, spot, post]);

  return { photoUris, googlePhotosDone: done };
}
