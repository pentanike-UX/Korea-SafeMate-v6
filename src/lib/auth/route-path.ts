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

/** `next` 쿼리용 locale-neutral 경로 (`/ko/routes/x` → `/routes/x`). */
export function localeNeutralPathWithSearch(pathname: string, search: string): string {
  const { pathname: pathWo } = stripLocaleFromPathname(pathname);
  return `${pathWo}${search}`;
}

/**
 * 서버 `redirect()` / proxy — URL에 locale prefix 포함 (`/ko/login?next=...`).
 * `next` 값은 locale-neutral (`/routes/...`) 로 통일.
 */
export function loginPathWithNext(pathname: string, search: string, locale: AppLocale): string {
  const base = loginPathForLocale(locale);
  const { pathname: pathWo } = stripLocaleFromPathname(pathname);
  if (pathWo === "/login" || pathWo.startsWith("/login/")) return base;
  const neutralNext = localeNeutralPathWithSearch(pathname, search);
  return `${base}?next=${encodeURIComponent(neutralNext)}`;
}

/**
 * 클라이언트 `@/i18n/navigation` `router.push` — login·next 모두 prefix 없음
 * (라우터가 현재 locale을 붙임. `/ko/login`을 넘기면 `/ko/ko/login` 404).
 */
export function loginPathWithNextForClientRouter(pathname: string, search: string): string {
  const { pathname: pathWo } = stripLocaleFromPathname(pathname);
  if (pathWo === "/login" || pathWo.startsWith("/login/")) return "/login";
  const neutralNext = localeNeutralPathWithSearch(pathname, search);
  return `/login?next=${encodeURIComponent(neutralNext)}`;
}

/** Prefix path with `/ko` / `/ja` when not default locale (matches next-intl `as-needed`). */
export function withLocalePath(locale: AppLocale, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (locale === routing.defaultLocale) return p;
  if (p === "/") return `/${locale}`;
  return `/${locale}${p}`;
}
