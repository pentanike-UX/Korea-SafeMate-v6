/**
 * Canonical public origin for OAuth redirects and post-login navigation.
 *
 * Vercel: set `NEXT_PUBLIC_SITE_URL` on **Preview and Production** to the same production
 * hostname (e.g. https://korea-safe-mate-v6.vercel.app). If it is missing on a Preview
 * deploy, this module avoids using the preview `*.vercel.app` host for OAuth.
 *
 * Never put a branch preview URL in `NEXT_PUBLIC_SITE_URL` — Google would redirect there
 * and Vercel Deployment Protection can show an extra Vercel login screen.
 */

/** Override via env for forks; default matches this project’s production Vercel host. */
function deployedOAuthFallbackOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_OAUTH_FALLBACK_ORIGIN?.trim();
  if (fromEnv) {
    const parsed = parseTrustedPublicOrigin(fromEnv);
    if (parsed) return parsed;
  }
  return "https://korea-safe-mate-v6.vercel.app";
}

/** Git-connected Vercel previews use `project-git-branch-….vercel.app` — unsafe for OAuth. */
function isVercelBranchPreviewHost(hostname: string): boolean {
  return hostname.endsWith(".vercel.app") && hostname.includes("-git-");
}

function parseTrustedPublicOrigin(raw: string): string | undefined {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (isVercelBranchPreviewHost(url.hostname)) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export function getCanonicalSiteOrigin(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN?.trim();
  if (!raw) return undefined;
  return parseTrustedPublicOrigin(raw);
}

/**
 * Browser — `signInWithOAuth` `redirectTo` origin.
 *
 * Priority order:
 *   1. localhost / 127.0.0.1 → always use the current window.origin
 *      (even if NEXT_PUBLIC_SITE_URL accidentally leaks into .env.local from `vercel env pull`).
 *      This guarantees local OAuth dev never bounces to production.
 *   2. NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_OAUTH_REDIRECT_ORIGIN env var.
 *   3. Production canonical fallback.
 */
/**
 * 로컬 개발용 호스트인지 판별 — localhost, 127.0.0.1, 사설 IPv4 대역
 * (10.x.x.x, 172.16-31.x.x, 192.168.x.x), `.local` mDNS 도메인.
 */
function isLocalDevHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  // 0.0.0.0 — 일부 환경에서 dev 서버 Network 주소를 그대로 클릭한 케이스
  if (hostname === "0.0.0.0") return true;
  if (hostname.endsWith(".local")) return true;
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
  return false;
}

export function getOAuthRedirectOriginForClient(): string {
  if (typeof window !== "undefined" && isLocalDevHost(window.location.hostname)) {
    return window.location.origin;
  }
  const fromEnv = getCanonicalSiteOrigin();
  if (fromEnv) return fromEnv;
  return deployedOAuthFallbackOrigin();
}

/**
 * Callback route — final redirect base after `exchangeCodeForSession`.
 * On Vercel Preview, avoids `x-forwarded-host` (preview URL) when env canonical is unset.
 */
export function resolveOAuthRedirectBase(request: Request): string {
  // 로컬 개발(`next dev`)에서는 .env.local에 production VERCEL_* env가 잔존해도
  // 실제 호스트는 localhost이므로 요청 origin을 그대로 신뢰한다.
  // (그렇지 않으면 콜백이 production URL로 server-side redirect되어 도메인이 바뀐다)
  if (process.env.NODE_ENV === "development") {
    return new URL(request.url).origin;
  }

  const canonical = getCanonicalSiteOrigin();
  if (canonical) return canonical;

  if (process.env.VERCEL === "1") {
    const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (vercelProd) {
      return vercelProd.startsWith("http") ? vercelProd.replace(/\/$/, "") : `https://${vercelProd}`;
    }
    return deployedOAuthFallbackOrigin();
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    return `https://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}
