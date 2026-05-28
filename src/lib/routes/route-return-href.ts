import { stripLocaleFromPathname } from "@/lib/auth/route-path";

/** 포스트 → 하루루트 진입 시 저장, 이탈 시 복귀용 (sessionStorage). */
export const ROUTE_RETURN_HREF_KEY = "safemate:route-return-href";
export const ROUTE_RETURN_POST_ID_KEY = "safemate:route-return-post-id";

export function rememberRouteReturnHref(explicitPostId?: string): void {
  if (typeof window === "undefined") return;
  const href = `${window.location.pathname}${window.location.search}`;
  sessionStorage.setItem(ROUTE_RETURN_HREF_KEY, href);

  const fromPath = window.location.pathname.match(/\/posts\/([^/]+)/)?.[1];
  const postId = explicitPostId?.trim() || (fromPath ? decodeURIComponent(fromPath) : null);
  if (postId) sessionStorage.setItem(ROUTE_RETURN_POST_ID_KEY, postId);
}

export function consumeRouteReturnTarget(): { href: string | null; postId: string | null } {
  if (typeof window === "undefined") return { href: null, postId: null };
  const href = sessionStorage.getItem(ROUTE_RETURN_HREF_KEY);
  const postId = sessionStorage.getItem(ROUTE_RETURN_POST_ID_KEY);
  sessionStorage.removeItem(ROUTE_RETURN_HREF_KEY);
  sessionStorage.removeItem(ROUTE_RETURN_POST_ID_KEY);
  return { href, postId };
}

/** next-intl `router.push`용 — 저장된 경로에서 locale prefix 제거. */
export function localeNeutralPathFromStoredHref(storedHref: string): string {
  const qs = storedHref.includes("?") ? storedHref.slice(storedHref.indexOf("?")) : "";
  const pathOnly = qs ? storedHref.slice(0, storedHref.indexOf("?")) : storedHref;
  const { pathname } = stripLocaleFromPathname(pathOnly);
  return `${pathname}${qs}`;
}

/** @deprecated consumeRouteReturnTarget 사용 */
export function consumeRouteReturnHref(): string | null {
  return consumeRouteReturnTarget().href;
}
