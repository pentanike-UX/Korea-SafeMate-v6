const ROUTE_INVITE_NEXT_RE =
  /^\/(?:ko|en|th|vi|ja)?\/?routes\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\?invite=([^&]+)/i;

/** `?next=` 경로에서 routeId + invite 토큰 추출 (로케일 접두 optional). */
export function parseInviteFromNextPath(nextPath: string | null | undefined): {
  routeId: string;
  inviteToken: string;
} | null {
  if (!nextPath) return null;
  const pathOnly = nextPath.split("#")[0] ?? nextPath;
  const qIdx = pathOnly.indexOf("?");
  const base = qIdx >= 0 ? pathOnly.slice(0, qIdx) : pathOnly;
  const search = qIdx >= 0 ? pathOnly.slice(qIdx + 1) : "";
  const inviteParam = new URLSearchParams(search).get("invite");
  if (!inviteParam?.trim()) return null;

  const m = pathOnly.match(ROUTE_INVITE_NEXT_RE);
  if (m) {
    return { routeId: m[1]!, inviteToken: decodeURIComponent(m[2]!) };
  }

  const routeMatch = base.match(
    /\/routes\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i,
  );
  if (!routeMatch) return null;
  return { routeId: routeMatch[1]!, inviteToken: inviteParam.trim() };
}
