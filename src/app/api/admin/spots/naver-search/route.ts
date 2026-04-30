/**
 * GET /api/admin/spots/naver-search?query=강남+카페&display=5
 *
 * Naver Local Search API 프록시 — Admin 전용.
 * Naver mapx/mapy (× 10^7 정수) → lat/lng 변환 포함.
 *
 * 환경변수:
 *   NAVER_SEARCH_CLIENT_ID     — Naver Cloud Platform Application Client ID
 *   NAVER_SEARCH_CLIENT_SECRET — Naver Cloud Platform Application Client Secret
 */
import { NextResponse } from "next/server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { naverSearchQuerySchema } from "@/lib/validation/spot-catalog";
import type { NaverPlaceSearchResult } from "@/types/domain";

const NAVER_LOCAL_SEARCH_URL = "https://openapi.naver.com/v1/search/local.json";

/** Naver HTML 태그 제거 (검색 결과 title에 <b> 태그 포함) */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

/** Naver place link에서 place ID 추출. 예: https://map.naver.com/v5/entry/place/12345 → "12345" */
function extractNaverPlaceId(link: string): string | null {
  const m = link.match(/\/place\/(\d+)/);
  return m?.[1] ?? null;
}

/** mapx/mapy (× 10^7) → lat/lng */
function naverCoordsToLatLng(mapx: string, mapy: string): { lat: number; lng: number } {
  return {
    lat: parseInt(mapy, 10) / 1e7,
    lng: parseInt(mapx, 10) / 1e7,
  };
}

async function assertAdmin(): Promise<boolean> {
  const sb = await getServerSupabaseForUser();
  if (!sb) return false;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb
    .from("users")
    .select("app_role")
    .eq("id", user.id)
    .maybeSingle();
  return data?.app_role === "admin" || data?.app_role === "super_admin";
}

export async function GET(request: Request) {
  // Admin guard
  const isAdmin = await assertAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse & validate query
  const { searchParams } = new URL(request.url);
  const parsed = naverSearchQuerySchema.safeParse({
    query: searchParams.get("query") ?? "",
    display: searchParams.get("display") ?? "5",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Naver API credentials not configured", hint: "Set NAVER_SEARCH_CLIENT_ID and NAVER_SEARCH_CLIENT_SECRET in Vercel env vars" },
      { status: 503 },
    );
  }

  try {
    const url = new URL(NAVER_LOCAL_SEARCH_URL);
    url.searchParams.set("query", parsed.data.query);
    url.searchParams.set("display", String(parsed.data.display));
    url.searchParams.set("sort", "random");

    const res = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      next: { revalidate: 0 }, // always fresh
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[naver-search] Naver API error:", res.status, body);
      return NextResponse.json(
        { error: "Naver API error", status: res.status },
        { status: 502 },
      );
    }

    const json = (await res.json()) as { items: NaverPlaceSearchResult[] };
    const items = (json.items ?? []).map((item) => {
      const { lat, lng } = naverCoordsToLatLng(item.mapx, item.mapy);
      return {
        title: stripHtml(item.title),
        naver_place_id: extractNaverPlaceId(item.link),
        link: item.link,
        category: item.category,
        address: item.address,
        roadAddress: item.roadAddress,
        lat,
        lng,
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[naver-search] fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
