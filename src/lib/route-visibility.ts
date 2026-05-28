/**
 * 하루루트 공개·열람 가능 상태 판정.
 */

export type RoutePublicationStatus =
  | "public"
  | "private"
  | "draft"
  | "under_review"
  | "deprecated"
  | "unknown";

export function normalizeRoutePublicationStatus(status: string | null | undefined): RoutePublicationStatus {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "public") return "public";
  if (s === "private") return "private";
  if (s === "draft") return "draft";
  if (s === "under_review") return "under_review";
  if (s === "deprecated") return "deprecated";
  return "unknown";
}

/** 무료 확산 모델 — 비로그인·공유 유입 포함 전체 열람 허용. */
export function isFreePublicRouteStatus(status: string | null | undefined): boolean {
  return normalizeRoutePublicationStatus(status) === "public";
}

export function routeBlockedMessageKey(
  status: string | null | undefined,
  deleted: boolean,
): "routeShareErrDeleted" | "routeShareErrNotPublished" | "routeShareErrBlocked" | null {
  if (deleted) return "routeShareErrDeleted";
  const pub = normalizeRoutePublicationStatus(status);
  if (pub === "private" || pub === "draft") return "routeShareErrNotPublished";
  if (pub === "under_review" || pub === "deprecated" || pub === "unknown") return "routeShareErrBlocked";
  return null;
}
