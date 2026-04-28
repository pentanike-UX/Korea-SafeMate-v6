"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";
import { HeaderAccountMenu } from "@/components/auth/header-account-menu";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useHomeHeaderContrast } from "@/hooks/use-home-header-contrast";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BookOpen, Compass, DollarSign, Home, Info, Menu, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV: { href: string; msgKey: "home" | "explore" | "howItWorks" | "pricing" | "guardians" | "about"; Icon: LucideIcon }[] = [
  { href: "/", msgKey: "home", Icon: Home },
  { href: "/explore/routes", msgKey: "explore", Icon: Compass },
  { href: "/how-it-works", msgKey: "howItWorks", Icon: BookOpen },
  { href: "/pricing", msgKey: "pricing", Icon: DollarSign },
  { href: "/guardians", msgKey: "guardians", Icon: Users },
  { href: "/about", msgKey: "about", Icon: Info },
];

function isNavActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavMsgKey = (typeof NAV)[number]["msgKey"];

function HeaderNavLinks({
  mobile,
  pathname,
  onDarkSurface,
  tNav,
}: {
  mobile?: boolean;
  pathname: string;
  onDarkSurface: boolean;
  tNav: (key: NavMsgKey) => string;
}) {
  const glassHeaderNav = onDarkSurface && !mobile;
  return (
    <nav className={cn("flex gap-1", mobile ? "flex-col gap-1.5" : "items-center")}>
      {NAV.map((item) => {
        const active = isNavActive(item.href, pathname);
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-[var(--radius-md)] font-medium transition-colors duration-200",
              mobile ? "min-h-12 px-3 py-3 text-base" : "px-3 py-2.5 text-sm",
              glassHeaderNav
                ? active
                  ? "bg-white/18 text-white ring-1 ring-white/30"
                  : "text-white/88 hover:bg-white/12 hover:text-white active:scale-[0.98]"
                : active
                  ? "bg-[var(--brand-trust-blue-soft)] text-[var(--brand-trust-blue)] ring-1 ring-[color-mix(in_srgb,var(--brand-trust-blue)_28%,transparent)]"
                  : "text-[var(--text-strong)]/85 hover:bg-muted hover:text-[var(--text-strong)] active:scale-[0.98]",
            )}
          >
            <Icon
              className={cn("size-[1.125rem] shrink-0 opacity-90", mobile ? "size-5" : "")}
              strokeWidth={1.75}
              aria-hidden
            />
            {tNav(item.msgKey)}
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const user = useAuthUser();
  const tNav = useTranslations("Nav");
  const tHeader = useTranslations("Header");
  const tBrand = useTranslations("Brand");
  const isHome = pathname === "/";
  const heroContrast = useHomeHeaderContrast();
  const onDarkSurface = isHome && heroContrast === "dark";
  const [homeHeaderScrolled, setHomeHeaderScrolled] = useState(false);

  useEffect(() => {
    if (!isHome || onDarkSurface) return;
    const update = () => setHomeHeaderScrolled(window.scrollY > 20);
    requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [isHome, onDarkSurface]);

  const homeLightGlass = isHome && !onDarkSurface && !homeHeaderScrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 ease-out",
        onDarkSurface
          ? "border-white/10 bg-black/24 shadow-none supports-[backdrop-filter]:bg-black/18"
          : homeLightGlass
            ? "border-border/25 bg-transparent shadow-none backdrop-blur-md supports-[backdrop-filter]:bg-background/18 max-md:supports-[backdrop-filter]:bg-background/12"
            : "border-border/70 bg-background/93 shadow-[var(--shadow-sm)] supports-[backdrop-filter]:bg-background/86",
      )}
    >
      <div className="flex min-h-14 h-14 w-full min-w-0 items-center gap-2 px-3 sm:h-16 sm:min-h-16 sm:gap-4 sm:px-6 md:px-8 xl:px-10">
        <Link
          href="/"
          className="flex min-w-0 max-w-[min(100%,calc(100%-6.5rem))] shrink items-center gap-2 rounded-lg active:opacity-90 min-[400px]:max-w-[min(100%,calc(100%-8.75rem))] sm:max-w-[min(100%,calc(100%-10.5rem))] sm:gap-2.5 md:max-w-none"
        >
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-sm font-bold text-[var(--text-on-brand)] shadow-sm ring-2 transition-[box-shadow] duration-300",
              onDarkSurface
                ? "ring-white/20"
                : "ring-[color-mix(in_srgb,var(--brand-trust-blue)_35%,transparent)] shadow-[0_1px_0_rgba(0,0,0,0.05)]",
            )}
          >
            42
          </span>
          <div className="min-w-0 leading-tight">
            <span
              className={cn(
                "block truncate text-sm font-semibold tracking-tight transition-colors duration-300",
                onDarkSurface ? "text-white" : "text-[var(--text-strong)]",
              )}
            >
              {BRAND.name}
            </span>
            <span
              className={cn(
                "hidden truncate text-[10px] font-medium transition-colors duration-300 sm:block",
                onDarkSurface ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {tBrand("tagline")}
            </span>
          </div>
        </Link>

        <div className="hidden min-w-0 md:flex md:flex-1 md:justify-center">
          <HeaderNavLinks pathname={pathname} onDarkSurface={onDarkSurface} tNav={tNav} />
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          {user === undefined ? (
            <div
              className={cn(
                "bg-muted/80 h-9 w-28 animate-pulse rounded-[var(--radius-md)]",
                onDarkSurface && "bg-white/15",
              )}
              aria-hidden
            />
          ) : user ? (
            <HeaderAccountMenu authUser={user} onDarkSurface={onDarkSurface} />
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "inline-flex h-9 min-h-9 px-3 text-sm",
                onDarkSurface
                  ? "text-white/90 hover:bg-white/10 hover:text-white"
                  : "text-[var(--text-strong)]/85 hover:bg-muted hover:text-[var(--text-strong)]",
              )}
            >
              <Link href="/login">{tHeader("logIn")}</Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger
              className={cn(
                "inline-flex size-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border outline-none transition-colors duration-200 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden",
                onDarkSurface
                  ? "border-white/28 bg-white/12 text-white hover:bg-white/18"
                  : "border-input bg-background text-[var(--text-strong)] hover:bg-muted",
              )}
              aria-label={tHeader("openMenu")}
            >
              <Menu className="size-[1.35rem]" strokeWidth={1.75} />
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[min(100%,22rem)] flex-col gap-2">
              <SheetHeader className="pb-2">
                <SheetTitle>{tHeader("menu")}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-5 pb-2">
                <HeaderNavLinks mobile pathname={pathname} onDarkSurface={onDarkSurface} tNav={tNav} />
                <div className="border-border/60 flex flex-col gap-2.5 border-t pt-4">
                  {!user ? (
                    <Button asChild variant="default" className="w-full justify-center rounded-[var(--radius-md)] font-semibold">
                      <Link href="/login">{tHeader("logIn")}</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
