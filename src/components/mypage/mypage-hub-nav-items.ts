import type { LucideIcon } from "lucide-react";
import {
  Coins,
  Compass,
  FolderOpen,
  HeartHandshake,
  LayoutDashboard,
  PenSquare,
  Settings,
  UserRound,
} from "lucide-react";

export type HubNavLabelKey =
  | "navJourneys"
  | "navProfile"
  | "navPoints"
  | "navMatches"
  | "guardianNavHome"
  | "guardianNavPoints"
  | "guardianNavSettings"
  | "guardianNavProfile"
  | "guardianNavNewPost"
  | "guardianNavPosts"
  | "guardianNavMatches";

export type HubNavItem = {
  href: string;
  labelKey: HubNavLabelKey;
  Icon: LucideIcon;
  match: (pathname: string) => boolean;
};

function travelerHomeMatch(p: string) {
  return p === "/mypage" || p === "/mypage/";
}

function travelerJourneysMatch(p: string) {
  return p === "/mypage/journeys" || p.startsWith("/mypage/journeys/");
}

/** 허브(/mypage) + 심화 여정 화면 — LNB는 「내 여정」 하나로 묶음 */
function travelerHubAndJourneysMatch(p: string) {
  return travelerHomeMatch(p) || travelerJourneysMatch(p);
}

function travelerProfileMatch(p: string) {
  return p === "/mypage/profile" || p.startsWith("/mypage/profile/");
}

function travelerPointsMatch(p: string) {
  return p === "/mypage/points" || p.startsWith("/mypage/points/");
}

function travelerMatchesMatch(p: string) {
  return p === "/mypage/matches" || p.startsWith("/mypage/matches/");
}

/** Traveler — 저장·요청·진행 요약(허브) / 프로필 / 포인트 / 매칭 */
export const TRAVELER_HUB_NAV: HubNavItem[] = [
  { href: "/mypage", labelKey: "navJourneys", Icon: Compass, match: travelerHubAndJourneysMatch },
  { href: "/mypage/profile", labelKey: "navProfile", Icon: UserRound, match: travelerProfileMatch },
  { href: "/mypage/points", labelKey: "navPoints", Icon: Coins, match: travelerPointsMatch },
  { href: "/mypage/matches", labelKey: "navMatches", Icon: HeartHandshake, match: travelerMatchesMatch },
];

function guardianProfileMatch(p: string) {
  return p.startsWith("/mypage/guardian/profile");
}

function guardianPostsListMatch(p: string) {
  return (
    p.startsWith("/mypage/guardian/posts") &&
    !p.startsWith("/mypage/guardian/posts/new")
  );
}

function guardianNewPostMatch(p: string) {
  return p.startsWith("/mypage/guardian/posts/new");
}

function guardianMatchesMatch(p: string) {
  return p.startsWith("/mypage/guardian/matches");
}

function guardianPointsMatch(p: string) {
  return p.startsWith("/mypage/guardian/points");
}

function guardianSettingsMatch(p: string) {
  return p.startsWith("/mypage/guardian/settings");
}

/** Guardian 운영 콘솔 — 홈 → 프로필 → 포스트 목록 → 신규 작성 → 매칭 → 포인트 → 설정 */
export const GUARDIAN_WORKSPACE_NAV: HubNavItem[] = [
  { href: "/mypage", labelKey: "guardianNavHome", Icon: LayoutDashboard, match: travelerHomeMatch },
  { href: "/mypage/guardian/profile/edit", labelKey: "guardianNavProfile", Icon: UserRound, match: guardianProfileMatch },
  {
    href: "/mypage/guardian/posts",
    labelKey: "guardianNavPosts",
    Icon: FolderOpen,
    match: guardianPostsListMatch,
  },
  {
    href: "/mypage/guardian/posts/new",
    labelKey: "guardianNavNewPost",
    Icon: PenSquare,
    match: guardianNewPostMatch,
  },
  { href: "/mypage/guardian/matches", labelKey: "guardianNavMatches", Icon: HeartHandshake, match: guardianMatchesMatch },
  { href: "/mypage/guardian/points", labelKey: "guardianNavPoints", Icon: Coins, match: guardianPointsMatch },
  { href: "/mypage/guardian/settings", labelKey: "guardianNavSettings", Icon: Settings, match: guardianSettingsMatch },
];

export function resolveActiveNavLabel(pathname: string, items: HubNavItem[]): HubNavItem | null {
  const hit = items.find((i) => i.match(pathname));
  return hit ?? null;
}
