"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { GUARDIAN_WORKSPACE } from "@/lib/mypage/guardian-workspace-routes";
import type { AppAccountRole } from "@/lib/auth/app-role";
import type { GuardianProfileStatus } from "@/lib/auth/guardian-profile-status";
import { MypageGuardianDashboard } from "@/components/mypage/mypage-guardian-dashboard";
import { MypageHubProfileHero } from "@/components/mypage/mypage-hub-profile-hero";
import { MypageHubProvider } from "@/components/mypage/mypage-hub-context";
import { MypageHubSegmentSwitcher } from "@/components/mypage/mypage-hub-segment-switcher";
import { MypageHubSideNavigation } from "@/components/mypage/mypage-hub-side-navigation";
import { useMypageAttentionView } from "@/lib/mypage-attention-read-state";
import { useTranslations } from "next-intl";
import type { MypagePointsApiResponse } from "@/lib/points/types";
import type { MypageHubSnapshot } from "@/types/mypage-hub";

const MYPAGE_MODE_KEY = "safemate-mypage-mode";

type HubMode = "traveler" | "guardian";

type GuardianCtaLabel =
  | "guardianCtaNone"
  | "guardianCtaDraft"
  | "guardianCtaSubmitted"
  | "guardianCtaApproved"
  | "guardianCtaRejected"
  | "guardianCtaSuspended";

function shouldShowMypageIdentityHero(pathname: string, hubMode: HubMode): boolean {
  if (hubMode === "traveler") {
    return pathname === "/mypage/profile" || pathname.startsWith("/mypage/profile/");
  }
  return pathname.startsWith("/mypage/guardian/profile");
}

export function MypageHubShell({
  children,
  appRole,
  guardianStatus,
  accountDisplayName,
  accountEmail,
  accountAvatarUrl,
  memberSinceIso,
  accountUserId = null,
  snapshot,
  pointsSheetInitial,
}: {
  children: React.ReactNode;
  appRole: AppAccountRole;
  guardianStatus: GuardianProfileStatus;
  accountDisplayName: string;
  accountEmail: string | null;
  accountAvatarUrl: string | null;
  memberSinceIso: string | null;
  accountUserId?: string | null;
  snapshot: MypageHubSnapshot;
  pointsSheetInitial: MypagePointsApiResponse | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("TravelerHub");
  const [hubMode, setHubMode] = useState<HubMode>("traveler");
  const [modeReady, setModeReady] = useState(false);

  useEffect(() => {
    const guardianUnlocked = snapshot.guardianSegmentUnlocked;
    const defaultMode: HubMode = appRole === "guardian" ? "guardian" : "traveler";
    const resolveMode = (candidate: HubMode): HubMode =>
      candidate === "guardian" && !guardianUnlocked ? "traveler" : candidate;

    let next: HubMode = defaultMode;
    try {
      const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const seg = params.get("segment");
      if (seg === "guardian" || seg === "traveler") {
        next = resolveMode(seg);
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("segment");
          const path = `${url.pathname}${url.search}`;
          window.history.replaceState({}, "", path);
        }
      } else {
        const stored = localStorage.getItem(MYPAGE_MODE_KEY);
        if (stored === "guardian" || stored === "traveler") {
          next = resolveMode(stored);
        }
      }
    } catch {
      next = defaultMode;
    }
    setHubMode(next);
    setModeReady(true);
  }, [appRole, snapshot.guardianSegmentUnlocked]);

  useEffect(() => {
    if (!modeReady) return;
    try {
      localStorage.setItem(MYPAGE_MODE_KEY, hubMode);
    } catch {
      /* ignore */
    }
  }, [hubMode, modeReady]);

  const guardianPrimaryCta = (): { href: string; labelKey: GuardianCtaLabel } => {
    switch (guardianStatus) {
      case "none":
        return { href: "/guardians/apply", labelKey: "guardianCtaNone" };
      case "draft":
        return { href: "/guardian/onboarding", labelKey: "guardianCtaDraft" };
      case "submitted":
        return { href: "/guardian/profile", labelKey: "guardianCtaSubmitted" };
      case "approved":
        return { href: "/mypage", labelKey: "guardianCtaApproved" };
      case "rejected":
        return { href: "/guardian/profile", labelKey: "guardianCtaRejected" };
      case "suspended":
        return { href: "/guardian/profile", labelKey: "guardianCtaSuspended" };
      default:
        return { href: "/guardians/apply", labelKey: "guardianCtaNone" };
    }
  };

  const approved = guardianStatus === "approved";
  const primary = guardianPrimaryCta();
  const showGuardianDashboard = hubMode === "guardian" && (pathname === "/mypage" || pathname === "/mypage/");
  const guardianWorkspaceWide =
    hubMode === "guardian" &&
    approved &&
    (pathname.startsWith("/mypage/guardian/posts") ||
      pathname.startsWith("/mypage/guardian/matches") ||
      pathname.startsWith("/mypage/guardian/profile") ||
      pathname.startsWith("/mypage/guardian/settings") ||
      pathname.startsWith("/mypage/guardian/points"));
  const guardianTabMuted = !snapshot.guardianSegmentUnlocked;
  const showIdentityHero = shouldShowMypageIdentityHero(pathname, hubMode);
  const { attention, markBlockAttentionSeen } = useMypageAttentionView(snapshot, pathname, accountUserId, hubMode);

  useEffect(() => {
    if (!modeReady) return;
    if (hubMode !== "guardian" || !approved) return;
    const p = pathname;
    if (p.startsWith("/mypage/guardian")) return;
    if (p === "/mypage" || p === "/mypage/") return;

    const travelerRoots = ["/mypage/journeys", "/mypage/requests", "/mypage/saved-guardians", "/mypage/saved-posts", "/mypage/messages"];
    for (const root of travelerRoots) {
      if (p === root || p.startsWith(`${root}/`)) {
        router.replace("/mypage");
        return;
      }
    }
    if (p.startsWith("/mypage/matches")) {
      router.replace("/mypage");
      return;
    }
    if (p.startsWith("/mypage/profile")) {
      router.replace("/mypage/guardian/profile/edit");
      return;
    }
    if (p.startsWith("/mypage/points")) {
      router.replace("/mypage/guardian/points");
      return;
    }
  }, [modeReady, hubMode, approved, pathname, router]);

  const mainPadding = cn(
    "w-full min-w-0 flex-1",
    guardianWorkspaceWide ? "px-5 pt-6 pb-24 sm:px-8 sm:pt-8 lg:px-10 lg:pb-12" : "px-4 pt-6 pb-24 sm:px-6 sm:pt-8 lg:px-10 lg:pb-12",
  );

  return (
    <MypageHubProvider
      value={{
        appRole,
        guardianStatus,
        accountUserId,
        snapshot,
        attention,
        markBlockAttentionSeen,
        pointsSheetInitial,
      }}
    >
      <div className="bg-[var(--bg-page)] flex min-h-screen w-full max-w-[100vw] flex-col md:flex-row">
        <aside
          className={cn(
            "border-border/60 bg-muted/15 flex w-full shrink-0 flex-col border-b md:w-72 md:border-r md:border-b-0 md:bg-muted/20",
            "md:sticky md:top-0 md:h-[100dvh] md:overflow-y-auto",
            hubMode === "guardian" && approved && "md:border-border/80 md:bg-card/90",
          )}
        >
          <div className="border-border/40 shrink-0 border-b px-4 py-4 md:px-5 md:py-5">
            <MypageHubSegmentSwitcher
              hubMode={hubMode}
              setHubMode={setHubMode}
              travelerBadgeCount={attention.unreadTravelerBadgeCount}
              guardianBadgeCount={attention.unreadGuardianBadgeCount}
              guardianTabMuted={guardianTabMuted}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 md:px-5 md:pb-8">
            <MypageHubSideNavigation
              hubMode={hubMode}
              setHubMode={setHubMode}
              approved={approved}
              guardianStatus={guardianStatus}
              primary={primary}
              travelerNavBadges={attention.unreadTravelerNavBadges}
              guardianWorkspaceNavBadges={attention.unreadGuardianWorkspaceNavBadges}
            />
            {hubMode === "traveler" && !snapshot.guardianSegmentUnlocked ? (
              <div className="border-border/60 mt-auto rounded-xl border border-dashed bg-muted/25 p-4">
                <p className="text-muted-foreground text-xs leading-relaxed">{t("guardianApplyTeaser")}</p>
                <button
                  type="button"
                  onClick={() => setHubMode("guardian")}
                  className="text-primary mt-3 inline-flex min-h-11 items-center text-sm font-semibold"
                >
                  {t("guardianApplyCta")}
                </button>
              </div>
            ) : null}
          </div>
        </aside>

        <main className={mainPadding}>
          {showIdentityHero ? (
            <div className="mb-8 w-full max-w-6xl sm:mb-10">
              <MypageHubProfileHero
                hubMode={hubMode}
                appRole={appRole}
                guardianStatus={guardianStatus}
                accountDisplayName={accountDisplayName}
                accountEmail={accountEmail}
                accountAvatarUrl={accountAvatarUrl}
                memberSinceIso={memberSinceIso}
                accountUserId={accountUserId}
              />
            </div>
          ) : null}

          <div
            className={cn(
              !guardianWorkspaceWide && !showGuardianDashboard && "w-full max-w-6xl",
              guardianWorkspaceWide && "w-full",
            )}
          >
            {showGuardianDashboard ? <MypageGuardianDashboard status={guardianStatus} /> : children}
          </div>
        </main>
      </div>
    </MypageHubProvider>
  );
}
