import type { AppLocale } from "@/types/haru";
import { loginPathWithNext, withLocalePath } from "@/lib/auth/route-path";

export const THANKS_INTENT_QUERY = "thanks";

/** 로그인 후 고마움 모달을 다시 열기 위한 쿼리. */
export function appendThanksIntentToSearch(search: string): string {
  const params = new URLSearchParams(search.replace(/^\?/, ""));
  params.set("intent", THANKS_INTENT_QUERY);
  const q = params.toString();
  return q ? `?${q}` : `?intent=${THANKS_INTENT_QUERY}`;
}

export function stripThanksIntentFromSearch(search: string): string {
  const params = new URLSearchParams(search.replace(/^\?/, ""));
  params.delete("intent");
  const q = params.toString();
  return q ? `?${q}` : "";
}

export function loginRedirectForThanksIntent(
  locale: AppLocale,
  pathname: string,
  search: string,
): string {
  return loginPathWithNext(pathname, appendThanksIntentToSearch(search), locale);
}

export function localizedRoutePath(locale: AppLocale, routeId: string, search = ""): string {
  const base = withLocalePath(locale, `/routes/${routeId}`);
  return search ? `${base}${search.startsWith("?") ? search : `?${search}`}` : base;
}
