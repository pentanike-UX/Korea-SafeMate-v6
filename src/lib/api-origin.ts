/**
 * Browser-only: build same-origin URL from site root so paths never resolve under a locale segment (e.g. `/ko/api/...` 404).
 */
export function sameOriginApiUrl(pathFromRoot: string): string {
  const p = pathFromRoot.startsWith("/") ? pathFromRoot : `/${pathFromRoot}`;
  if (typeof window === "undefined") return p;
  return `${window.location.origin}${p}`;
}
