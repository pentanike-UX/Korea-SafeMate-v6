"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter as useI18nRouter } from "@/i18n/navigation";
import { useRouter as useNextRouter } from "next/navigation";
import { routing } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logoutMockSuperAdmin } from "@/lib/dev/logout-mock-super-admin";
import { ChevronDown, CreditCard, LayoutDashboard, ShieldCheck } from "lucide-react";

export function MockSuperAdminHeaderMenu({ onDarkSurface }: { onDarkSurface: boolean }) {
  const t = useTranslations("Header");
  const locale = useLocale();
  const pathname = usePathname();
  const i18nRouter = useI18nRouter();
  const nextRouter = useNextRouter();
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const publicHomeHref = locale === routing.defaultLocale ? "/" : `/${locale}`;

  const goAdmin = (close: () => void) => {
    close();
    nextRouter.push("/admin/dashboard");
  };

  const goPricing = (close: () => void) => {
    close();
    i18nRouter.push("/pricing");
  };

  const isProtectedPath = (p: string) =>
    p === "/mypage" ||
    p.startsWith("/mypage/") ||
    p === "/guardian" ||
    p.startsWith("/guardian/") ||
    p.startsWith("/admin");

  const handleLogout = async (close: () => void) => {
    close();
    await logoutMockSuperAdmin();
    if (isProtectedPath(pathname)) {
      window.location.href = publicHomeHref;
      return;
    }
    nextRouter.refresh();
  };

  const triggerClassBase =
    "inline-flex h-9 min-h-9 min-w-0 items-center gap-1.5 rounded-[var(--radius-md)] border text-left text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50";

  const triggerClassDesktop = cn(
    triggerClassBase,
    "max-w-[min(100%,15rem)] px-2.5",
    onDarkSurface
      ? "border-white/25 bg-white/10 text-white hover:bg-white/16"
      : "border-border/80 bg-background hover:bg-muted/80",
  );

  const triggerClassMobile = cn(
    triggerClassBase,
    "max-w-[min(100%,5.75rem)] px-1.5 min-[360px]:max-w-[min(100%,9rem)] min-[360px]:px-2 sm:max-w-[min(100%,12rem)] sm:px-2",
    onDarkSurface
      ? "border-white/25 bg-white/10 text-white hover:bg-white/16"
      : "border-border/80 bg-background hover:bg-muted/80",
  );

  const row =
    "hover:bg-accent focus-visible:bg-accent flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-left text-base font-medium text-foreground outline-none transition-colors";

  const menuBlock = (close: () => void) => (
    <>
      <DropdownMenuItem className="min-h-11" onClick={() => goAdmin(close)}>
        <LayoutDashboard className="size-4 opacity-80" aria-hidden />
        {t("mockSuperAdminDashboard")}
      </DropdownMenuItem>
      <DropdownMenuItem className="min-h-11" onClick={() => goPricing(close)}>
        <CreditCard className="size-4 opacity-80" aria-hidden />
        {t("mockSuperAdminPlanStatus")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        className="min-h-11"
        onClick={(e) => {
          e.preventDefault();
          void handleLogout(close);
        }}
      >
        {t("logOut")}
      </DropdownMenuItem>
    </>
  );

  const menuMobile = (close: () => void) => (
    <nav className="flex flex-col gap-1 px-2" aria-label={t("mockSuperAdminMenuAria")}>
      <button type="button" className={row} onClick={() => goAdmin(close)}>
        <LayoutDashboard className="size-5 shrink-0 opacity-80" aria-hidden />
        {t("mockSuperAdminDashboard")}
      </button>
      <button type="button" className={row} onClick={() => goPricing(close)}>
        <CreditCard className="size-5 shrink-0 opacity-80" aria-hidden />
        {t("mockSuperAdminPlanStatus")}
      </button>
      <div className="border-border/60 my-2 border-t" />
      <button
        type="button"
        className={cn(row, "text-destructive hover:bg-destructive/10")}
        onClick={() => void handleLogout(close)}
      >
        {t("logOut")}
      </button>
    </nav>
  );

  const triggerInner = (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="size-[18px]" strokeWidth={2} aria-hidden />
      </span>
      <span className={cn("min-w-0 flex-1 truncate", onDarkSurface ? "text-white" : "text-foreground")}>
        {t("mockSuperAdminLabel")}
      </span>
      <ChevronDown className={cn("size-4 shrink-0 opacity-70", onDarkSurface ? "text-white" : "")} aria-hidden />
    </>
  );

  return (
    <>
      <div className="hidden sm:block">
        <DropdownMenu open={desktopOpen} onOpenChange={setDesktopOpen}>
          <DropdownMenuTrigger
            className={triggerClassDesktop}
            aria-label={t("mockSuperAdminMenuAria")}
            aria-expanded={desktopOpen}
            aria-haspopup="menu"
          >
            {triggerInner}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(calc(100vw-2rem),20rem)] p-1" sideOffset={6}>
            {menuBlock(() => setDesktopOpen(false))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="sm:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className={triggerClassMobile}
            aria-label={t("mockSuperAdminMenuAria")}
            aria-expanded={mobileOpen}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="size-[16px]" strokeWidth={2} aria-hidden />
            </span>
            <span
              className={cn("min-w-0 flex-1 truncate text-xs", onDarkSurface ? "text-white" : "text-foreground")}
            >
              {t("mockSuperAdminLabel")}
            </span>
            <ChevronDown className={cn("size-4 shrink-0 opacity-70", onDarkSurface ? "text-white" : "")} aria-hidden />
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[min(85vh,28rem)] rounded-t-2xl px-0 pt-4 pb-6">
            <SheetHeader className="sr-only">
              <SheetTitle>{t("mockSuperAdminMenuTitle")}</SheetTitle>
            </SheetHeader>
            {menuMobile(() => setMobileOpen(false))}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
