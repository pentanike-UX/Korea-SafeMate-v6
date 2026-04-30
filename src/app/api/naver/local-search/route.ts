/**
 * GET /api/naver/local-search?query=강남+카페&display=5
 *
 * Naver Local Search API 서버 프록시.
 * NAVER_SEARCH_CLIENT_SECRET 는 서버에서만 사용 — 클라이언트 번들에 노출되지 않음.
 *
 * 환경변수:
 *   NAVER_SEARCH_CLIENT_ID     (서버 전용)
 *   NAVER_SEARCH_CLIENT_SECRET (서버 전용, 절대 NEXT_PUBLIC_ 금지)
 *
 * 반환:
 *   items[]: { title, naver_place_id, link, category, address, roadAddress, lat, lng }
 */
import { NextResponse } from "next/server";
import { z } from "zod";

const NAVER_LOCAL_URL = "https://openapi.naver.com/v1/search/local.json";

const querySchema = z.object({
  query: z.string().min(1).max(80),
  display: z.coerce.number().int().min(1).max(5).default(5),
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
    query: searchParams.get("query") ?? "",
    display: searchParams.get("display") ?? "5",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "query 파라미터가 필요합니다", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // 환경변수 없으면 빈 결과 반환 (앱 미중단)
    console.warn("[naver/local-search] NAVER_SEARCH_CLIENT_ID / SECRET not set");
    return NextResponse.json({ items: [], unavailable: true });
  }

  try {
    const url = new URL(NAVER_LOCAL_URL);
    url.searchParams.set("query", parsed.data.query);
    url.searchParams.set("display", String(parsed.data.display));
    url.searchParams.set("sort", "random");

    const res = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      next: { revalidate: 300 }, // 5분 캐시
    });

    if (!res.ok) {
      console.error("[naver/local-search] API error:", res.status);
      return NextResponse.json({ items: [], error: "upstream_error" });
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

    const items = (json.items ?? []).map((item) => ({
      title: stripHtml(item.title),
      naver_place_id: extractNaverPlaceId(item.link),
      link: item.link,
      category: item.category,
      address: item.address,
      roadAddress: item.roadAddress,
      // mapx/mapy is × 10^7 integer string
      lat: parseInt(item.mapy, 10) / 1e7,
      lng: parseInt(item.mapx, 10) / 1e7,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[naver/local-search] fetch error:", err);
    return NextResponse.json({ items: [], error: "internal_error" });
  }
}
