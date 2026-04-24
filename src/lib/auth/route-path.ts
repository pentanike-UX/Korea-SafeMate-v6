import { routing, type AppLocale } from "@/i18n/routing";

const LOCALES = new Set<string>(routing.locales);

export type StrippedPath = {
  locale: AppLocale;
  pathname: string;
};

/**
 * Strips optional locale prefix (ko, ja). Default locale `en` has no prefix with `localePrefix: "as-needed"`.
 */
export function stripLocaleFromPathname(pathname: string): StrippedPath {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];
  if (first && LOCALES.has(first) && first !== routing.defaultLocale) {
    return {
      locale: first as AppLocale,
      pathname: parts.length <= 1 ? "/" : `/${parts.slice(1).join("/")}`,
    };
  }
  return {
    locale: routing.defaultLocale,
    pathname: pathname === "" ? "/" : pathname.startsWith("/") ? pathname : `/${pathname}`,
  };
}

export function loginPathForLocale(locale: AppLocale): string {
  return locale === routing.defaultLocale ? "/login" : `/${locale}/login`;
}

/** 로그인으로 보낼 때, 로그인 페이지가 아니면 `?next=`로 복귀 경로를 붙입니다. */
export function loginPathWithNext(pathname: string, search: string, locale: AppLocale): string {
  const base = loginPathForLocale(locale);
  const { pathname: pathWo } = stripLocaleFromPathname(pathname);
  if (pathWo === "/login" || pathWo.startsWith("/login/")) return base;
  const full = `${pathname}${search}`;
  return `${base}?next=${encodeURIComponent(full)}`;
}

/** Prefix path with `/ko` / `/ja` when not default locale (matches next-intl `as-needed`). */
export function withLocalePath(locale: AppLocale, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (locale === routing.defaultLocale) return p;
  if (p === "/") return `/${locale}`;
  return `/${locale}${p}`;
}
