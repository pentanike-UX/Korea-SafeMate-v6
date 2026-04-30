/**
 * GET /api/naver/image-search
 *
 * 정규화 응답:
 * { items: [{ title, url, thumbnail, width, height, source: "naver-image", score }] }
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import type { NaverImageCandidate } from "@/types/domain";
import { parseImageLinkHostname } from "@/lib/naver-image-filters";
import type { ImageScoreContext } from "@/lib/naver-image-quality";
import {
  scoreAndSortNaverCandidates,
  shouldExcludeNaverCandidate,
  stripHtmlTitle,
} from "@/lib/naver-image-quality";

const NAVER_IMAGE_URL = "https://openapi.naver.com/v1/search/image";

const querySchema = z.object({
  query: z.string().min(1).max(120),
  display: z.coerce.number().int().min(1).max(10).default(10),
  start: z.coerce.number().int().min(1).max(1000).default(1),
  sort: z.enum(["sim", "date"]).default("sim"),
  filter: z.enum(["all", "large", "medium", "small"]).default("medium"),
  realPlaceName: z.string().max(80).optional(),
  district: z.string().max(40).optional(),
  spotName: z.string().max(80).optional(),
  displayName: z.string().max(80).optional(),
});

/** 서버 메모리 캐시 — 24h */
const memoryCache = new Map<string, { at: number; body: unknown }>();
const MEM_TTL = 24 * 60 * 60 * 1000;

function cacheKey(parsed: z.infer<typeof querySchema>): string {
  return JSON.stringify({
    q: parsed.query,
    d: parsed.display,
    st: parsed.start,
    so: parsed.sort,
    fi: parsed.filter,
    rp: parsed.realPlaceName ?? "",
    di: parsed.district ?? "",
    sn: parsed.spotName ?? "",
    dn: parsed.displayName ?? "",
  });
}

function scoreContextFromQuery(parsed: z.infer<typeof querySchema>): ImageScoreContext {
  return {
    real_place_name: parsed.realPlaceName ?? null,
    district: parsed.district ?? null,
    spot_name: parsed.spotName ?? null,
    display_name: parsed.displayName ?? null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    query: searchParams.get("query") ?? "",
    display: searchParams.get("display") ?? "10",
    start: searchParams.get("start") ?? "1",
    sort: searchParams.get("sort") ?? "sim",
    filter: searchParams.get("filter") ?? "medium",
    realPlaceName: searchParams.get("realPlaceName") ?? undefined,
    district: searchParams.get("district") ?? undefined,
    spotName: searchParams.get("spotName") ?? undefined,
    displayName: searchParams.get("displayName") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "query 파라미터가 필요합니다", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  const envMissing = !clientId || !clientSecret;

  if (envMissing) {
    console.warn("[naver/image-search] env missing — NAVER_SEARCH_CLIENT_ID / NAVER_SEARCH_CLIENT_SECRET");
    return NextResponse.json({ items: [], unavailable: true, error: "env_missing" });
  }

  const data = parsed.data;
  const ctx = scoreContextFromQuery(data);
  const ck = cacheKey(data);
  const hit = memoryCache.get(ck);
  if (hit && Date.now() - hit.at < MEM_TTL) {
    return NextResponse.json(hit.body);
  }

  try {
    const fetchCount = Math.min(50, Math.max(data.display * 5, 30));
    const url = new URL(NAVER_IMAGE_URL);
    url.searchParams.set("query", data.query);
    url.searchParams.set("display", String(fetchCount));
    url.searchParams.set("start", String(data.start));
    url.searchParams.set("sort", data.sort);
    url.searchParams.set("filter", data.filter);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      next: { revalidate: 600 },
    });

    const statusCode = res.status;
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn("[naver/image-search] upstream error", {
        query: data.query.slice(0, 80),
        statusCode,
        message: errText.slice(0, 200),
      });
      const body = { items: [], error: "upstream_error", statusCode };
      return NextResponse.json(body);
    }

    type NaverRawItem = {
      title: string;
      link: string;
      thumbnail: string;
      sizewidth: string;
      sizeheight: string;
    };

    const json = (await res.json()) as { items?: NaverRawItem[] };
    const rawItems = json.items ?? [];

    const mapped: NaverImageCandidate[] = rawItems.map((item) => {
      const title = stripHtmlTitle(item.title);
      const w = parseInt(item.sizewidth, 10);
      const h = parseInt(item.sizeheight, 10);
      return {
        title,
        link: item.link,
        url: item.link,
        thumbnail: item.thumbnail,
        sizewidth: item.sizewidth,
        sizeheight: item.sizeheight,
        width: Number.isFinite(w) ? w : undefined,
        height: Number.isFinite(h) ? h : undefined,
        source_domain: parseImageLinkHostname(item.link),
        source: "naver-image" as const,
      };
    });

    const filtered = mapped.filter((item) => {
      const tw = parseInt(item.sizewidth, 10);
      const th = parseInt(item.sizeheight, 10);
      return !shouldExcludeNaverCandidate(item.title, item.link ?? "", tw, th);
    });

    const ranked = scoreAndSortNaverCandidates(filtered, ctx).slice(0, data.display);

    const items = ranked.map((item) => {
      const pw = parseInt(item.sizewidth, 10);
      const ph = parseInt(item.sizeheight, 10);
      return {
        title: item.title,
        url: item.link,
        thumbnail: item.thumbnail,
        width: item.width ?? (Number.isFinite(pw) ? pw : 0),
        height: item.height ?? (Number.isFinite(ph) ? ph : 0),
        source: "naver-image" as const,
        score: item.score,
        link: item.link,
        sizewidth: item.sizewidth,
        sizeheight: item.sizeheight,
      };
    });

    const body = { items };

    console.info("[naver/image-search] ok", {
      query: data.query.slice(0, 80),
      statusCode,
      rawLength: rawItems.length,
      itemsLength: items.length,
      envMissing: false,
    });

    memoryCache.set(ck, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch (err) {
    console.error("[naver/image-search] fetch error", {
      query: data.query.slice(0, 80),
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ items: [], error: "internal_error" });
  }
}
