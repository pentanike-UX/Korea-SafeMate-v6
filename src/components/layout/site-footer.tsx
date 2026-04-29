import type { ComponentProps } from "react";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FooterCompactControls } from "@/components/layout/footer-preferences";
import { BRAND } from "@/lib/constants";

export async function SiteFooter() {
  const tFooter = await getTranslations("Footer");
  const tBrand = await getTranslations("Brand");
  const tNav = await getTranslations("Nav");

  type AppHref = ComponentProps<typeof Link>["href"];
  /** 헤더와 동일한 1차 정보 구조 + 지원·약관 */
  const sitemap: { href: AppHref; label: string }[] = [
    { href: "/", label: tNav("home") },
    { href: "/explore/routes", label: tNav("explore") },
    { href: "/how-it-works", label: tNav("howItWorks") },
    { href: "/pricing", label: tNav("pricing") },
    { href: "/guardians", label: tNav("guardians") },
    { href: "/about", label: tNav("about") },
    { href: "/guardians/apply", label: tFooter("apply") },
    { href: "/about#terms" as AppHref, label: tFooter("termsLink") },
    { href: "/about#privacy" as AppHref, label: tFooter("privacyLink") },
  ];

  const linkQuiet =
    "inline-flex min-h-8 items-center rounded-[var(--radius-md)] py-0.5 text-[13px] leading-6 font-medium text-white/52 transition-colors hover:text-white/88";

  return (
    <footer className="border-t border-white/10 bg-[#131a2a] text-white dark:bg-[#05070d]">
      <div className="w-full px-4 py-10 sm:px-6 sm:py-12 md:px-8 md:py-14 xl:px-10">
        <div className="border-b border-white/12 pb-8 sm:pb-10">
          <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:gap-y-10">
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

          </div>
        </div>

        <div className="pt-5 sm:pt-6">
          <div className="flex flex-col gap-2 text-[11px] leading-relaxed text-white/42 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <p>
              {tFooter("copyright", { year: new Date().getFullYear() })}
              {process.env.NODE_ENV === "development" ? (
                <>
                  {" · "}
                  <NextLink href="/admin/dashboard" className="hover:text-white/65 transition-colors">
                    Admin
                  </NextLink>
                </>
              ) : null}
            </p>
            <FooterCompactControls />
          </div>
        </div>
      </div>
    </footer>
  );
}
