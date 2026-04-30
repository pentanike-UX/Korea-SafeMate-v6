/**
 * GET /api/naver/image-search?query=블루보틀+강남점+외관&display=6
 *
 * Naver Image Search API 서버 프록시.
 * NAVER_SEARCH_CLIENT_SECRET 은 서버에서만 사용 — 클라이언트 번들 노출 없음.
 *
 * 환경변수:
 *   NAVER_SEARCH_CLIENT_ID     (서버 전용)
 *   NAVER_SEARCH_CLIENT_SECRET (서버 전용)
 *
 * 반환:
 *   items[]: { title, link, thumbnail, sizewidth, sizeheight }
 *   - 300px 미만 썸네일, 성인 콘텐츠는 Naver API 레벨에서 최대한 필터
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import type { NaverImageCandidate } from "@/types/domain";
import { isDiscouragedNaverImageTitle, parseImageLinkHostname } from "@/lib/naver-image-filters";

const NAVER_IMAGE_URL = "https://openapi.naver.com/v1/search/image";

const querySchema = z.object({
  query: z.string().min(1).max(120),
  display: z.coerce.number().int().min(1).max(10).default(6),
});

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

/** 최소 크기 미달 이미지 필터 (매우 작은 아이콘·로고 제외) */
function isUsableImage(item: { sizewidth: string; sizeheight: string }): boolean {
  const w = parseInt(item.sizewidth, 10);
  const h = parseInt(item.sizeheight, 10);
  // 너비 300px 미만 또는 높이 200px 미만 제외
  if (w < 300 || h < 200) return false;
  // 극단적 종횡비 제외 (아이콘·배너 등)
  const ratio = w / h;
  if (ratio > 4 || ratio < 0.3) return false;
  return true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    query: searchParams.get("query") ?? "",
    display: searchParams.get("display") ?? "6",
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
    console.warn("[naver/image-search] NAVER_SEARCH_CLIENT_ID / SECRET not set");
    return NextResponse.json({ items: [], unavailable: true });
  }

  try {
    // display를 여유있게 요청해서 필터 후에도 충분히 남도록
    // 제목 필터·크기 필터로 탈락이 많으므로 넉넉히 요청
    const fetchCount = Math.min(parsed.data.display * 5, 50);

    const url = new URL(NAVER_IMAGE_URL);
    url.searchParams.set("query", parsed.data.query);
    url.searchParams.set("display", String(fetchCount));
    url.searchParams.set("sort", "sim");    // 관련도 정렬
    url.searchParams.set("filter", "medium"); // 중간 크기 이상 필터

    const res = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      next: { revalidate: 600 }, // 10분 캐시 (이미지 검색은 덜 실시간)
    });

    if (!res.ok) {
      console.error("[naver/image-search] API error:", res.status);
      return NextResponse.json({ items: [], error: "upstream_error" });
    }

    type NaverRawItem = {
      title: string;
      link: string;
      thumbnail: string;
      sizewidth: string;
      sizeheight: string;
    };

    const json = (await res.json()) as { items: NaverRawItem[] };

    const items: NaverImageCandidate[] = (json.items ?? [])
      .filter(isUsableImage)
      .filter((item) => !isDiscouragedNaverImageTitle(stripHtml(item.title)))
      .slice(0, parsed.data.display)
      .map((item) => {
        const title = stripHtml(item.title);
        return {
          title,
          link: item.link,
          thumbnail: item.thumbnail,
          sizewidth: item.sizewidth,
          sizeheight: item.sizeheight,
          source_domain: parseImageLinkHostname(item.link),
        };
      });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[naver/image-search] fetch error:", err);
    return NextResponse.json({ items: [], error: "internal_error" });
  }
}
