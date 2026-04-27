import { defineRouting } from "next-intl/routing";

/**
 * App locales:
 *  - en (default) — Traveler 국제 기본
 *  - ko           — Guardian + Admin
 *  - ja           — v3 유지 (Foundation 갭: th/vi 추가됨)
 *  - th           — Traveler 태국 (v6 신규)
 *  - vi           — Traveler 베트남 (v6 신규)
 *
 * URL: `en` 은 prefix 없음; 나머지는 `/ko`, `/ja`, `/th`, `/vi` (`as-needed`).
 * Cookie NEXT_LOCALE remembers choice (next-intl / proxy).
 */
export const routing = defineRouting({
  locales: ["en", "ko", "ja", "th", "vi"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];
