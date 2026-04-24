import { defineRouting } from "next-intl/routing";

/**
 * App locales: English (default), Korean, Japanese.
 * URL: `en` has no prefix; `ko` / `ja` use `/ko`, `/ja` (`as-needed`).
 * Cookie NEXT_LOCALE remembers choice (next-intl / proxy).
 */
export const routing = defineRouting({
  locales: ["en", "ko", "ja"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];
