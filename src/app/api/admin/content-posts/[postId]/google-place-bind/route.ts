import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  googlePlaceDetails,
  googlePlacesSearchText,
  type GoogleTextSearchPlace,
} from "@/lib/google-places-server";
import {
  MOCK_SUPER_ADMIN_COOKIE_NAME,
  isMockSuperAdminCookieValue,
  isSuperAdminLoginEnabled,
} from "@/lib/dev/mock-super-admin-auth";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { buildGoogleTextSearchQuery } from "@/lib/google-place-query";
import type { ContentPost, RouteSpot } from "@/types/domain";

const bodySchema = z.object({
  spotId: z.string().min(1),
});

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

function uniqueTokens(parts: Array<string | undefined>): string[] {
  return [...new Set(parts.map((x) => x?.trim()).filter((x): x is string => Boolean(x && x.length > 0)))];
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
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
  list: GoogleTextSearchPlace[],
  spot: RouteSpot,
  extraTokens: string[],
): GoogleTextSearchPlace | undefined {
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

type Props = { params: Promise<{ postId: string }> };

export async function POST(req: Request, ctx: Props) {
  if (!isSuperAdminLoginEnabled()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const cookieStore = await cookies();
  if (!isMockSuperAdminCookieValue(cookieStore.get(MOCK_SUPER_ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { postId } = await ctx.params;
  const parsedBody = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { spotId } = parsedBody.data;

  const sb = createServiceRoleSupabase();
  if (!sb) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 503 });
  }

  const { data: row, error } = await sb
    .from("content_posts")
    .select("id, title, region_id, route_journey")
    .eq("id", postId)
    .maybeSingle();
  if (error || !row) {
    return NextResponse.json({ error: "post_not_found" }, { status: 404 });
  }

  const journey = row.route_journey as ContentPost["route_journey"] | null;
  if (!journey?.spots?.length) {
    return NextResponse.json({ error: "route_journey_missing" }, { status: 400 });
  }

  const spotIdx = journey.spots.findIndex((s) => s.id === spotId);
  if (spotIdx < 0) {
    return NextResponse.json({ error: "spot_not_found" }, { status: 404 });
  }

  const target = journey.spots[spotIdx]!;
  const override = placeQueryOverride(target);
  let placeId = target.google?.placeId?.trim()?.replace(/^places\//, "") ?? "";

  if (!placeId) {
    const q = override.query ?? buildGoogleTextSearchQuery(target, { id: postId, region_slug: "", title: row.title } as ContentPost);
    if (q.length < 2) {
      return NextResponse.json({ error: "query_too_short" }, { status: 400 });
    }
    const { places, rawError } = await googlePlacesSearchText({
      textQuery: q,
      regionCode: "KR",
      pageSize: 8,
      locationBias:
        Number.isFinite(target.lat) && Number.isFinite(target.lng) && !(target.lat === 0 && target.lng === 0)
          ? {
              circle: {
                center: { latitude: target.lat, longitude: target.lng },
                radius: 5000,
              },
            }
          : undefined,
    });
    if (rawError) {
      return NextResponse.json({ error: "google_search_failed", detail: rawError }, { status: 502 });
    }
    const pick = pickBestPlace(places, target, override.tokens);
    placeId = pick?.placeId?.trim()?.replace(/^places\//, "") ?? "";
    if (!placeId) {
      return NextResponse.json({ error: "place_not_resolved" }, { status: 404 });
    }
  }

  const { details, rawError: detailsError } = await googlePlaceDetails(placeId);
  if (!details) {
    return NextResponse.json({ error: "google_details_failed", detail: detailsError ?? null }, { status: 502 });
  }

  const nextSpots = [...journey.spots];
  const nextSpot = { ...target };
  nextSpot.google = {
    placeId: details.placeId,
    displayName: details.displayName,
    formattedAddress: details.formattedAddress,
    location: details.location,
    photos: details.photos,
  };
  nextSpots[spotIdx] = nextSpot;

  const { error: updateError } = await sb
    .from("content_posts")
    .update({
      route_journey: {
        ...journey,
        spots: nextSpots,
      },
    })
    .eq("id", postId);

  if (updateError) {
    return NextResponse.json({ error: "save_failed", detail: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    spotId: target.id,
    google: nextSpot.google,
  });
}

