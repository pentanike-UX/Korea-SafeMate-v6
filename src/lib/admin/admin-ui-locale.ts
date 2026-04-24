import { routing, type AppLocale } from "@/i18n/routing";

/**
 * 관리자 UI (`/admin/*`) 기본 로케일.
 * 공개 앱은 `routing.defaultLocale`(`en`)이지만, NEXT_LOCALE 쿠키가 없을 때 관리자는 한글 UI를 기본으로 둔다.
 * 사용자가 공개 영역에서 언어를 바꾼 경우 쿠키가 있으면 그 값을 그대로 따른다.
 */
export const ADMIN_UI_DEFAULT_LOCALE: AppLocale = "ko";

export function resolveAdminUiLocale(nextLocaleCookie: string | undefined): AppLocale {
  const raw = nextLocaleCookie?.trim();
  if (raw && routing.locales.includes(raw as AppLocale)) {
    return raw as AppLocale;
  }
  return ADMIN_UI_DEFAULT_LOCALE;
}
