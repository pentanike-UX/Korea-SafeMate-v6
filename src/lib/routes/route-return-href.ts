/** 포스트 → 하루루트 진입 시 저장, 이탈 시 복귀용 (sessionStorage). */
export const ROUTE_RETURN_HREF_KEY = "safemate:route-return-href";

export function rememberRouteReturnHref(): void {
  if (typeof window === "undefined") return;
  const href = `${window.location.pathname}${window.location.search}`;
  sessionStorage.setItem(ROUTE_RETURN_HREF_KEY, href);
}

export function consumeRouteReturnHref(): string | null {
  if (typeof window === "undefined") return null;
  const href = sessionStorage.getItem(ROUTE_RETURN_HREF_KEY);
  if (href) sessionStorage.removeItem(ROUTE_RETURN_HREF_KEY);
  return href;
}
