import type { ComponentProps } from "react";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FooterPreferences } from "@/components/layout/footer-preferences";
import { BRAND } from "@/lib/constants";

export async function SiteFooter() {
  const tFooter = await getTranslations("Footer");
  const tBrand = await getTranslations("Brand");
  const tNav = await getTranslations("Nav");
  const tHeader = await getTranslations("Header");

  type AppHref = ComponentProps<typeof Link>["href"];
  const sitemap: { href: AppHref; label: string }[] = [
    { href: "/explore", label: tNav("explore") },
    { href: "/posts", label: tNav("posts") },
    { href: "/guardians", label: tNav("guardians") },
    // Option A (default): hide /mypage until login UX is ready.
    // Option B (future): add a simple "준비 중" /mypage page and restore this link.
    { href: "/about", label: tNav("about") },
    { href: "/guardians/apply", label: tFooter("apply") },
    { href: "/about#terms" as AppHref, label: tFooter("termsLink") },
    { href: "/about#privacy" as AppHref, label: tFooter("privacyLink") },
  ];

  const linkQuiet =
    "inline-flex min-h-8 items-center rounded-[var(--radius-md)] py-0.5 text-[13px] leading-6 font-medium text-white/52 transition-colors hover:text-white/88";

  const adminQuiet =
    "inline-flex h-9 min-h-9 w-fit items-center justify-center rounded-[var(--radius-md)] border border-white/12 bg-transparent px-3 text-xs font-medium text-white/48 transition-colors hover:border-white/22 hover:bg-white/[0.04] hover:text-white/75";

  return (
    <footer className="border-t border-white/10 bg-[#131a2a] text-white dark:bg-[#05070d]">
      <div className="w-full px-4 py-10 sm:px-6 sm:py-12 md:px-8 md:py-14 xl:px-10">
        <div className="border-b border-white/12 pb-8 sm:pb-10">
          <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,15rem)] lg:items-start lg:gap-10 lg:gap-y-10">
            <section className="max-w-lg">
              <p className="text-[10px] font-semibold tracking-[0.26em] text-sky-200/80 uppercase">{tFooter("brandKicker")}</p>
              <p className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-[1.75rem] sm:leading-tight">{BRAND.name}</p>
              <p className="mt-2 text-base font-semibold leading-snug text-white/92">{tBrand("tagline")}</p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/58">{tFooter("brandPitch")}</p>
            </section>

            <nav
              className="border-t border-white/10 pt-8 lg:border-t-0 lg:pt-0"
              aria-label={tFooter("sitemapAria")}
            >
              <p className="mb-3 text-[10px] font-medium tracking-[0.18em] text-white/38 uppercase">{tFooter("sitemapTitle")}</p>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-0.5 sm:max-w-md">
                {sitemap.map((item) => (
                  <li key={`${item.href}-${item.label}`}>
                    <Link href={item.href} className={linkQuiet}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-8 lg:border-t-0 lg:border-l lg:border-white/10 lg:pt-0 lg:pl-8">
              <p className="text-[10px] font-medium tracking-[0.18em] text-white/35 uppercase lg:sr-only">{tFooter("prefsAria")}</p>
              <div className="max-lg:rounded-xl max-lg:border max-lg:border-white/[0.07] max-lg:bg-white/[0.02] max-lg:p-3">
                <FooterPreferences className="justify-start opacity-85" />
              </div>
              {process.env.NODE_ENV === "development" ? (
                <NextLink href="/admin/dashboard" className={adminQuiet}>
                  {tFooter("adminConsoleLink")}
                </NextLink>
              ) : null}
            </div>
          </div>
        </div>

        <div className="pt-5 sm:pt-6">
          <div className="flex flex-col gap-1.5 text-[11px] leading-relaxed text-white/42 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <p>{tFooter("copyright", { year: new Date().getFullYear() })}</p>
            <p className="text-white/38">{tFooter("hqLine")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
