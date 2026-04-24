import crypto from "node:crypto";

const SEP = ".";

function previewSecret(): string {
  return (
    process.env.GUARDIAN_POST_PREVIEW_SECRET ??
    process.env.GUARDIAN_POSTS_API_SECRET ??
    "dev-insecure-preview-secret"
  );
}

/** Time-limited HMAC token for guardian draft/pending post preview URLs. */
export function signPostPreviewToken(postId: string, ttlSec = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = Buffer.from(JSON.stringify({ postId, exp }), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", previewSecret()).update(payload).digest("base64url");
  return `${payload}${SEP}${sig}`;
}

export function verifyPostPreviewToken(token: string | undefined | null): { postId: string } | null {
  if (!token || typeof token !== "string") return null;
  const i = token.indexOf(SEP);
  if (i <= 0) return null;
  const payload = token.slice(0, i);
  const sig = token.slice(i + SEP.length);
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", previewSecret()).update(payload).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }
  let parsed: { postId: string; exp: number };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { postId: string; exp: number };
  } catch {
    return null;
  }
  if (typeof parsed.postId !== "string" || typeof parsed.exp !== "number") return null;
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return { postId: parsed.postId };
}
