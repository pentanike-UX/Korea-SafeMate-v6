"use client";

import { useTranslations } from "next-intl";
import { Compass, Users, MessageCircle, CircleUser, type LucideIcon } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { cn } from "@/lib/utils";

/**
 * 모바일 전용 하단 탭바 (로그인 사용자). 데스크톱(md+)에서는 헤더 네비를 사용하므로 숨김.
 * 자체 하단 고정 CTA가 있는 상세/플로우 화면에서는 겹침 방지를 위해 렌더하지 않는다.
 */
const HIDE_PREFIXES = [
  "/login",
  "/signup",
  "/onboarding",
  "/book",
  "/checkout",
  "/guardian", // 가디언 워크스페이스 (/guardians 목록과 구분됨)
  "/mypage/guardian", // mypage 내 가디언 워크스페이스(포스트 에디터 등) — 집중 플로우
  "/admin",
  "/explore/journey",
];

function isHidden(pathname: string): boolean {
  for (const p of HIDE_PREFIXES) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return true;
  }
  if (pathname.startsWith("/routes/")) return true; // 루트 뷰 — 저장 바
  if (/^\/guardians\/.+/.test(pathname)) return true; // 가디언 상세 — sticky CTA
  return false;
}

export function MobileBottomTabBar() {
  const user = useAuthUser();
  const pathname = usePathname();
  const tNav = useTranslations("Nav");
  const tHub = useTranslations("TravelerHub");

  if (!user || isHidden(pathname)) return null;

  const tabs: { href: string; label: string; Icon: LucideIcon; active: boolean }[] = [
    {
      href: "/posts",
      label: tNav("posts"),
      Icon: Compass,
      active: pathname.startsWith("/posts") || pathname.startsWith("/explore"),
    },
    {
      href: "/guardians",
      label: tNav("guardians"),
      Icon: Users,
      active: pathname === "/guardians",
    },
    {
      href: "/mypage/messages",
      label: tHub("navMessages"),
      Icon: MessageCircle,
      active: pathname.startsWith("/mypage/messages"),
    },
    {
      href: "/mypage",
      label: tHub("navOverview"),
      Icon: CircleUser,
      active: pathname.startsWith("/mypage") && !pathname.startsWith("/mypage/messages"),
    },
  ];

  return (
    <>
      {/* 인플로우 스페이서 — 고정 탭바가 콘텐츠 하단을 가리지 않도록 */}
      <div aria-hidden className="h-[calc(3.75rem+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label={tHub("navOverview")}
        className="border-border/60 bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-lg md:hidden"
      >
        <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {tabs.map((tab) => (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={tab.active ? "page" : undefined}
                className={cn(
                  "flex min-h-[3.5rem] flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-semibold transition-colors",
                  tab.active ? "text-[var(--brand-primary)]" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.Icon className="size-5 shrink-0" strokeWidth={tab.active ? 2.4 : 2} aria-hidden />
                <span className="max-w-full truncate">{tab.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
