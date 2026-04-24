"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { GuardianProfileStatus } from "@/lib/auth/guardian-profile-status";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  GUARDIAN_WORKSPACE_NAV,
  TRAVELER_HUB_NAV,
  resolveActiveNavLabel,
  type HubNavItem,
} from "@/components/mypage/mypage-hub-nav-items";
import { MypageMenuCountBadge } from "@/components/mypage/mypage-attention-primitives";
import type { GuardianWorkspaceNavBadgeKey, TravelerNavBadgeKey } from "@/types/mypage-hub";
import { ChevronDown } from "lucide-react";

type GuardianCtaLabel =
  | "guardianCtaNone"
  | "guardianCtaDraft"
  | "guardianCtaSubmitted"
  | "guardianCtaApproved"
  | "guardianCtaRejected"
  | "guardianCtaSuspended";

const segmentNavItem =
  "flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-[15px] font-medium transition-colors lg:min-h-12 lg:py-3.5";

function navPool(hubMode: "traveler" | "guardian", approved: boolean): HubNavItem[] {
  if (hubMode === "traveler") return TRAVELER_HUB_NAV;
  if (approved) return GUARDIAN_WORKSPACE_NAV;
  return TRAVELER_HUB_NAV;
}

function mobileTriggerLabel(
  pathname: string,
  hubMode: "traveler" | "guardian",
  approved: boolean,
  t: ReturnType<typeof useTranslations<"TravelerHub">>,
) {
  const pool = navPool(hubMode, approved);
  const hit = resolveActiveNavLabel(pathname, pool);
  if (hit) return t(hit.labelKey);
  if (hubMode === "guardian" && pathname.startsWith("/mypage/guardian")) {
    return t("mobileNavFallbackGuardian");
  }
  return t("mobileNavFallback");
}

function lnbBadgeCount(
  travelerNavBadges: Record<TravelerNavBadgeKey, number>,
  guardianWorkspaceNavBadges: Record<GuardianWorkspaceNavBadgeKey, number>,
  item: HubNavItem,
  section: "traveler" | "guardianWorkspace",
): number {
  if (section === "traveler") {
    return travelerNavBadges[item.labelKey as TravelerNavBadgeKey] ?? 0;
  }
  if (
    item.labelKey !== "guardianNavProfile" &&
    item.labelKey !== "guardianNavNewPost" &&
    item.labelKey !== "guardianNavPosts" &&
    item.labelKey !== "guardianNavMatches"
  ) {
    return 0;
  }
  return guardianWorkspaceNavBadges[item.labelKey as GuardianWorkspaceNavBadgeKey] ?? 0;
}

export function MypageHubSideNavigation({
  hubMode,
  setHubMode,
  approved,
  guardianStatus,
  primary,
  travelerNavBadges,
  guardianWorkspaceNavBadges,
}: {
  hubMode: "traveler" | "guardian";
  setHubMode: (m: "traveler" | "guardian") => void;
  approved: boolean;
  guardianStatus: GuardianProfileStatus;
  primary: { href: string; labelKey: GuardianCtaLabel };
  travelerNavBadges: Record<TravelerNavBadgeKey, number>;
  guardianWorkspaceNavBadges: Record<GuardianWorkspaceNavBadgeKey, number>;
}) {
  const pathname = usePathname();
  const t = useTranslations("TravelerHub");
  const [sheetOpen, setSheetOpen] = useState(false);

  const pool = navPool(hubMode, approved);
  const triggerLabel = mobileTriggerLabel(pathname, hubMode, approved, t);

  const linkClass = (active: boolean) =>
    cn(
      segmentNavItem,
      "w-full justify-between",
      active
        ? "bg-[var(--brand-trust-blue-soft)] text-[var(--brand-trust-blue)] ring-1 ring-[color-mix(in_srgb,var(--brand-trust-blue)_22%,transparent)]"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  const renderNavRow = (
    item: HubNavItem,
    section: "traveler" | "guardianWorkspace",
    onNavigate?: () => void,
  ) => {
    const active = item.match(pathname);
    const badge = lnbBadgeCount(travelerNavBadges, guardianWorkspaceNavBadges, item, section);
    return (
      <li key={item.href + item.labelKey}>
        <Link
          href={item.href}
          className={linkClass(active)}
          onClick={() => {
            onNavigate?.();
          }}
        >
          <item.Icon className="size-5 shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
          <span className="min-w-0 flex-1">{t(item.labelKey)}</span>
          <MypageMenuCountBadge count={badge} ariaLabel={t("attentionNavBadgeAria", { menu: t(item.labelKey) })} />
        </Link>
      </li>
    );
  };

  const sheetTitle =
    hubMode === "traveler" ? t("mobileNavSheetTitleTraveler") : t("mobileNavSheetTitleGuardian");

  return (
    <div className="min-w-0 flex-1">
      {/* 모바일: 현재 위치 + 바텀시트 */}
      <div className="lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            className="border-border/80 bg-card text-foreground mb-1 flex h-12 w-full max-w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border px-4 text-left text-[15px] font-semibold shadow-sm outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-expanded={sheetOpen}
            aria-haspopup="dialog"
          >
            <span className="min-w-0 flex-1 truncate">{triggerLabel}</span>
            <ChevronDown className="text-muted-foreground size-4 shrink-0 opacity-80" aria-hidden />
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[min(88dvh,32rem)] rounded-t-2xl px-0 pt-2 pb-6">
            <SheetHeader className="border-border/60 border-b px-5 pb-4 text-left">
              <SheetTitle>{sheetTitle}</SheetTitle>
              <p className="text-muted-foreground text-sm font-normal">{t("mobileNavSheetHint")}</p>
            </SheetHeader>
            <nav className="max-h-[min(70dvh,26rem)] overflow-y-auto px-3 py-3" aria-label={t("navAria")}>
              {hubMode === "guardian" && !approved ? (
                <div className="space-y-3 px-2 pb-2">
                  <Button asChild className="h-12 w-full rounded-[var(--radius-md)] font-semibold">
                    <Link href={primary.href} onClick={() => setSheetOpen(false)}>
                      {t(primary.labelKey)}
                    </Link>
                  </Button>
                  <p className="text-muted-foreground text-xs leading-relaxed">{t(`guardianStatus.${guardianStatus}`)}</p>
                </div>
              ) : null}
              <ul className="flex flex-col gap-1">
                {hubMode === "guardian" && !approved ? (
                  TRAVELER_HUB_NAV.map((item) => renderNavRow(item, "traveler", () => setSheetOpen(false)))
                ) : hubMode === "guardian" && approved ? (
                  <>
                    <li className="px-2 pb-1 pt-2">
                      <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                        {t("navSectionGuardian")}
                      </p>
                    </li>
                    {GUARDIAN_WORKSPACE_NAV.map((item) => renderNavRow(item, "guardianWorkspace", () => setSheetOpen(false)))}
                  </>
                ) : (
                  pool.map((item) => renderNavRow(item, "traveler", () => setSheetOpen(false)))
                )}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* 데스크톱 + 모바일에서 가디언 비승인 카드 */}
      {hubMode === "guardian" && !approved ? (
        <nav
          className="border-border/60 mt-2 hidden rounded-xl border border-border/70 bg-card/70 p-4 shadow-[var(--shadow-sm)] lg:block"
          aria-label={t("guardianModeNavAria")}
        >
          <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">{t("guardianStripTitle")}</p>
          <p className="text-muted-foreground mt-2 text-xs leading-snug">{t(`guardianStatus.${guardianStatus}`)}</p>
          <p className="text-muted-foreground/90 mt-2 text-[11px] leading-relaxed">{t("guardianNavMypageNote")}</p>
          <Button asChild className="mt-4 h-12 w-full rounded-[var(--radius-md)] font-semibold">
            <Link href={primary.href}>{t(primary.labelKey)}</Link>
          </Button>
          {guardianStatus === "submitted" ? (
            <p className="text-muted-foreground mt-3 text-xs leading-relaxed">{t("guardianCtaSubmittedHint")}</p>
          ) : null}
          {guardianStatus === "suspended" ? (
            <p className="text-muted-foreground mt-3 text-xs leading-relaxed">{t("guardianCtaSuspendedHint")}</p>
          ) : null}
        </nav>
      ) : null}

      {hubMode === "traveler" || approved ? (
        <nav className="hidden lg:block" aria-label={hubMode === "traveler" ? t("navAria") : t("guardianModeNavAria")}>
          {hubMode === "guardian" && approved ? (
            <div>
              <p className="text-muted-foreground mb-2 px-4 text-[10px] font-bold tracking-widest uppercase">
                {t("navSectionGuardian")}
              </p>
              <ul className="flex flex-col gap-1.5">
                {GUARDIAN_WORKSPACE_NAV.map((item) => renderNavRow(item, "guardianWorkspace"))}
              </ul>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">{pool.map((item) => renderNavRow(item, "traveler"))}</ul>
          )}
        </nav>
      ) : null}

      {hubMode === "guardian" && approved ? (
        <button
          type="button"
          onClick={() => setHubMode("traveler")}
          className="text-muted-foreground hover:text-foreground mt-4 inline-flex min-h-11 items-center text-sm font-medium lg:mt-6"
        >
          ← {t("backToTravelerMode")}
        </button>
      ) : null}

      {hubMode === "guardian" && !approved ? (
        <button
          type="button"
          onClick={() => setHubMode("traveler")}
          className="text-muted-foreground hover:text-foreground mt-4 inline-flex min-h-11 items-center text-sm font-medium lg:mt-6"
        >
          ← {t("backToTravelerMode")}
        </button>
      ) : null}
    </div>
  );
}
