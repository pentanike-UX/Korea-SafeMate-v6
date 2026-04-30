/**
 * GET /api/image-proxy?url=https%3A%2F%2F...
 * 외부 이미지 hotlink 우회용 — 서버에서 fetch 후 전달.
 */
import { NextResponse } from "next/server";

const ALLOWED_PREFIXES = ["http://", "https://"];

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw?.trim()) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (!ALLOWED_PREFIXES.some((p) => target.toString().startsWith(p))) {
    return NextResponse.json({ error: "protocol not allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent": "KoreaSafeMate-ImageProxy/1.0",
        Accept: "image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "upstream failed" }, { status: 502 });
    }

    const buf = await res.arrayBuffer();
    const ct = res.headers.get("content-type") ?? "application/octet-stream";
    if (!ct.startsWith("image/") && !ct.includes("octet-stream")) {
      return NextResponse.json({ error: "not an image" }, { status: 415 });
    }

    return new NextResponse(buf, {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (e) {
    console.warn("[image-proxy]", target.origin, e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
