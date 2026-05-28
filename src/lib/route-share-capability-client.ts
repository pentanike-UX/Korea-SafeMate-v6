import type { ShareCapability } from "@/types/share-capability";

const INVITE_STORAGE_PREFIX = "route-reshare-invite:";

/** `?invite=` 진입 시 토큰을 sessionStorage에 보관 — redeem 후 URL에서 사라져도 재공유 URL 복원. */
export function persistInviteTokenForReshare(routeId: string, inviteToken: string | null) {
  if (typeof window === "undefined" || !inviteToken?.trim()) return;
  try {
    sessionStorage.setItem(`${INVITE_STORAGE_PREFIX}${routeId}`, inviteToken.trim());
  } catch {
    /* private mode 등 */
  }
}

export function readPersistedInviteToken(routeId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(`${INVITE_STORAGE_PREFIX}${routeId}`);
  } catch {
    return null;
  }
}

export function toAbsoluteShareUrl(shareUrl: string): string {
  if (typeof window === "undefined") return shareUrl;
  if (shareUrl.startsWith("http://") || shareUrl.startsWith("https://")) return shareUrl;
  return `${window.location.origin}${shareUrl.startsWith("/") ? shareUrl : `/${shareUrl}`}`;
}

export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

export type ShareCapabilityMessageKey =
  | "routeShareErrRestricted"
  | "routeShareErrExpired"
  | "routeShareErrDeleted"
  | "routeShareErrPrivate"
  | "routeShareErrBlocked"
  | "routeShareErrUnknown";

export function shareCapabilityMessageKey(cap: ShareCapability): ShareCapabilityMessageKey {
  switch (cap) {
    case "expired":
      return "routeShareErrExpired";
    case "deleted":
      return "routeShareErrDeleted";
    case "private":
      return "routeShareErrPrivate";
    case "blocked":
      return "routeShareErrBlocked";
    case "restricted":
      return "routeShareErrRestricted";
    case "unknown":
    default:
      return "routeShareErrUnknown";
  }
}
