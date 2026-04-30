/**
 * GET /api/naver/resolve-primary-place
 *
 * Local Search → 유사도 1순위 장소 Entity(primaryPlace). 시크릿은 서버만.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import type { NaverPrimaryPlace } from "@/types/domain";
import {
  pickBestLocalMatch,
  type LocalSearchItemForScore,
  type PlaceSimilarityInput,
} from "@/lib/naver-place-similarity";

const NAVER_LOCAL_URL = "https://openapi.naver.com/v1/search/local.json";

const querySchema = z.object({
  realPlaceName: z.string().max(120).optional(),
  spotName: z.string().max(120).optional(),
  displayName: z.string().max(120).optional(),
  district: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
  roadAddress: z.string().max(200).optional(),
  title: z.string().max(120).optional(),
  category: z.string().max(120).optional(),
  /** 스팟 식별 — 로깅용 */
  spotId: z.string().max(80).optional(),
});

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

function extractNaverPlaceId(link: string): string | null {
  const m = link.match(/\/place\/(\d+)/);
  return m?.[1] ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    realPlaceName: searchParams.get("realPlaceName") ?? undefined,
    spotName: searchParams.get("spotName") ?? undefined,
    displayName: searchParams.get("displayName") ?? undefined,
    district: searchParams.get("district") ?? undefined,
    address: searchParams.get("address") ?? undefined,
    roadAddress: searchParams.get("roadAddress") ?? undefined,
    title: searchParams.get("title") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    spotId: searchParams.get("spotId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ primaryPlace: null, items: [], unavailable: true, searchQueryUsed: "" });
  }

  const p = parsed.data;
  const name =
    p.realPlaceName?.trim() || p.spotName?.trim() || p.displayName?.trim() || p.title?.trim() || "";
  const dist = p.district?.trim() ?? "";
  let searchQuery = `${name} ${dist}`.trim();
  if (searchQuery.length < 4) {
    searchQuery = [name, p.roadAddress, p.address].filter(Boolean).join(" ").trim();
  }
  searchQuery = searchQuery.slice(0, 80);
  if (!searchQuery) {
    return NextResponse.json({ primaryPlace: null, items: [], searchQueryUsed: "", emptyQuery: true });
  }

  try {
    const url = new URL(NAVER_LOCAL_URL);
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("display", "5");
    url.searchParams.set("sort", "comment");

    const res = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return NextResponse.json({ primaryPlace: null, items: [], error: "upstream_error", searchQueryUsed: searchQuery });
    }

    type NaverLocalItem = {
      title: string;
      link: string;
      category: string;
      address: string;
      roadAddress: string;
      mapx: string;
      mapy: string;
    };

    const json = (await res.json()) as { items: NaverLocalItem[] };
    const rawItems = json.items ?? [];

    const itemsForScore: LocalSearchItemForScore[] = rawItems.map((item) => ({
      title: stripHtml(item.title),
      category: item.category,
      address: item.address,
      roadAddress: item.roadAddress,
      link: item.link,
    }));

    const spotInput: PlaceSimilarityInput = {
      real_place_name: p.realPlaceName,
      spot_name: p.spotName,
      display_name: p.displayName,
      district: p.district,
      title: p.title ?? "",
      category: p.category,
    };

    const best = pickBestLocalMatch(spotInput, itemsForScore);

    let primaryPlace: NaverPrimaryPlace | null = null;
    if (best) {
      const src = rawItems[best.index];
      primaryPlace = {
        title: stripHtml(src.title),
        category: src.category,
        address: src.address,
        roadAddress: src.roadAddress,
        mapx: src.mapx,
        mapy: src.mapy,
        link: src.link,
        similarityScore: best.score,
        source: "naver-local",
        naver_place_id: extractNaverPlaceId(src.link),
        lat: parseInt(src.mapy, 10) / 1e7,
        lng: parseInt(src.mapx, 10) / 1e7,
      };
    }

    const items = itemsForScore.map((it, i) => ({
      ...it,
      rank: i,
      lat: parseInt(rawItems[i]?.mapy ?? "0", 10) / 1e7,
      lng: parseInt(rawItems[i]?.mapx ?? "0", 10) / 1e7,
    }));

    return NextResponse.json({
      primaryPlace,
      items,
      searchQueryUsed: searchQuery,
    });
  } catch (err) {
    console.error("[naver/resolve-primary-place]", err);
    return NextResponse.json({ primaryPlace: null, items: [], error: "internal_error", searchQueryUsed: searchQuery });
  }
}
