/**
 * GET /api/image-proxy?url=https%3A%2F%2F...
 * 외부 이미지 hotlink 우회용 — 서버에서 fetch 후 전달.
 *
 * 보안: ALLOWED_HOSTS allowlist로 SSRF 방지.
 * 지원 도메인: Naver 이미지 CDN, Google Places photoUri CDN.
 */
import { NextResponse } from "next/server";

/**
 * 허용된 이미지 CDN 호스트명 목록.
 * 와일드카드 `*.googleusercontent.com` 형식으로 일치.
 */
const ALLOWED_HOSTS = new Set([
  // Naver Image Search
  "search.pstatic.net",
  "ssl.pstatic.net",
  "phinf.pstatic.net",
  "blogfiles.pstatic.net",
  "postfiles.pstatic.net",
  "cafeptthumb-phinf.pstatic.net",
  // Google Places Photo Media (New API) photoUri CDN
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
  // Google Maps
  "maps.googleapis.com",
  "maps.gstatic.com",
  // Wikimedia / Unsplash
  "upload.wikimedia.org",
  "images.unsplash.com",
]);

/** Google CDN 도메인 여부 — 추가 헤더 필요 */
function isGoogleCdn(hostname: string): boolean {
  return hostname.endsWith(".googleusercontent.com") || hostname.endsWith(".googleapis.com");
}

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

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return NextResponse.json({ error: "protocol not allowed" }, { status: 400 });
  }

  // SSRF 방지: allowlist 검사
  if (!ALLOWED_HOSTS.has(target.hostname) && !isGoogleCdn(target.hostname)) {
    console.warn("[image-proxy] blocked host:", target.hostname);
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (compatible; KoreaSafeMate-ImageProxy/1.0; +https://haruway.com)",
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  };

  // Google CDN — Referer + Accept-Language 추가 (일부 photoUri에서 필요)
  if (isGoogleCdn(target.hostname)) {
    headers["Referer"] = "https://www.google.com/";
    headers["Accept-Language"] = "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7";
  }

  try {
    const res = await fetch(target.toString(), {
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.warn("[image-proxy] upstream failed:", target.hostname, res.status);
      return NextResponse.json({ error: "upstream failed", status: res.status }, { status: 502 });
    }

    const ct = res.headers.get("content-type") ?? "application/octet-stream";
    if (!ct.startsWith("image/") && !ct.includes("octet-stream")) {
      return NextResponse.json({ error: "not an image", contentType: ct }, { status: 415 });
    }

    const buf = await res.arrayBuffer();
    // 10MB 이상 차단 (CDN 이미지치고 비정상)
    if (buf.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "image too large" }, { status: 413 });
    }

    return new NextResponse(buf, {
      headers: {
        "Content-Type": ct,
        // Google photoUri는 단기 URL이므로 캐시를 짧게 (1시간)
        "Cache-Control": isGoogleCdn(target.hostname)
          ? "public, max-age=3600, s-maxage=3600"
          : "public, max-age=86400, s-maxage=86400",
        "X-Proxy-Host": target.hostname,
      },
    });
  } catch (e) {
    console.warn("[image-proxy] fetch error:", target.origin, e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
