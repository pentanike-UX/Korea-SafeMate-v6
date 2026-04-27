import type { AppAccountRole } from "@/lib/auth/app-role";
import type { GuardianProfileStatus } from "@/lib/auth/guardian-profile-status";
import type { MypagePointsApiResponse } from "@/lib/points/types";

export type GuardianRecentPostLine = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
};

export type GuardianOpsSnapshot = {
  pendingPosts: number;
  draftPosts: number;
  reviewingBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  openPoolCount: number;
  points: number | null;
  recentPosts: GuardianRecentPostLine[];
};

/** LNB 여행자 메뉴 키 — `mypage-hub-nav-items` TRAVELER_HUB_NAV.labelKey 와 동일 */
export const TRAVELER_NAV_BADGE_KEYS = ["navJourneys", "navMyRoutes", "navProfile", "navPoints", "navMatches"] as const;
export type TravelerNavBadgeKey = (typeof TRAVELER_NAV_BADGE_KEYS)[number];

/** 가디언 워크스페이스 LNB — GUARDIAN_WORKSPACE_NAV.labelKey */
export const GUARDIAN_WORKSPACE_NAV_BADGE_KEYS = [
  "guardianNavHome",
  "guardianNavProfile",
  "guardianNavNewPost",
  "guardianNavPosts",
  "guardianNavMatches",
  "guardianNavPoints",
  "guardianNavSettings",
] as const;
export type GuardianWorkspaceNavBadgeKey = (typeof GUARDIAN_WORKSPACE_NAV_BADGE_KEYS)[number];

/** 화면 블록 단위 안내(세그먼트·메뉴 배지와 동일 데이터 소스) */
export type TravelerBlockAttention = {
  /** 여정 요청(MVP mock) — reviewing | requested */
  openTripRequests: number;
  matches: {
    pending: number;
    reviewDue: number;
    accepted: number;
  };
  /** 최근 7일 포인트 원장 건수(실제 DB); mock 계정은 0 */
  pointsRecentLedgerCount: number;
  /** 저장 가디언 수 — 시그니처·블록 배지용 (쿠키/샘플) */
  savedGuardianCount: number;
  /** 저장 포스트 수 — 시그니처·블록 배지용 (샘플 또는 추후 DB) */
  savedPostCount: number;
  /** 추후: 여행자에게 도착한 신규 리뷰·피드백 (현재 0) */
  inboundReviewSignals: number;
};

export type GuardianWorkspaceBlockAttention = {
  incomingMatchRequests: number;
  bookingsReviewing: number;
  openPoolSignal: number;
  postsPendingReview: number;
  postsDrafts: number;
  inProgressBookings: number;
  /** 계정 단위 최근 7일 원장 건수(여행자 블록과 동일 소스) */
  pointsRecentLedgerCount: number;
};

export type MypageHubSnapshot = {
  travelerBadgeCount: number;
  guardianBadgeCount: number;
  guardianSegmentUnlocked: boolean;
  guardianOps: GuardianOpsSnapshot | null;
  /** 헤더 dot — traveler 또는 guardian 배지가 하나라도 있을 때 */
  globalAttentionDot: boolean;
  travelerNavBadges: Record<TravelerNavBadgeKey, number>;
  travelerNavSignatures: Record<TravelerNavBadgeKey, string>;
  guardianWorkspaceNavBadges: Record<GuardianWorkspaceNavBadgeKey, number>;
  guardianWorkspaceNavSignatures: Record<GuardianWorkspaceNavBadgeKey, string>;
  travelerBlockAttention: TravelerBlockAttention;
  guardianWorkspaceBlockAttention: GuardianWorkspaceBlockAttention | null;
  blockAttentionCounts: Record<AttentionBlockKey, number>;
  blockAttentionSignatures: Record<AttentionBlockKey, string>;
};

export type AttentionMenuKey = TravelerNavBadgeKey | GuardianWorkspaceNavBadgeKey;

/**
 * 블록 단위 attention — 메뉴(LNB)보다 세분화된 read 상태.
 * 시그니처·raw count는 `getMypageHubSnapshot`에서 채운다.
 */
export const ATTENTION_BLOCK_KEYS = [
  "traveler.journeys.openTrips",
  "traveler.journeys.savedGuardians",
  "traveler.journeys.savedPosts",
  "traveler.matches.newResponses",
  "traveler.matches.reviewDue",
  "traveler.points.newEarnings",
  "traveler.reviews.newInbound",
  "guardian.posts.pendingReview",
  "guardian.posts.drafts",
  "guardian.matches.newRequests",
  "guardian.matches.reviewQueue",
  "guardian.matches.activeProgress",
  "guardian.points.newEarnings",
  "guardian.profile.needsRevision",
] as const;
export type AttentionBlockKey = (typeof ATTENTION_BLOCK_KEYS)[number];

/** 블록이 속한 LNB 메뉴(파티션된 메뉴는 블록 합으로 unread 계산) */
export const ATTENTION_BLOCK_PARENT_MENU: Record<AttentionBlockKey, AttentionMenuKey | null> = {
  "traveler.journeys.openTrips": "navJourneys",
  "traveler.journeys.savedGuardians": "navJourneys",
  "traveler.journeys.savedPosts": "navJourneys",
  "traveler.matches.newResponses": "navMatches",
  "traveler.matches.reviewDue": "navMatches",
  "traveler.points.newEarnings": "navPoints",
  "traveler.reviews.newInbound": "navMatches",
  "guardian.posts.pendingReview": "guardianNavPosts",
  "guardian.posts.drafts": "guardianNavPosts",
  "guardian.matches.newRequests": "guardianNavMatches",
  "guardian.matches.reviewQueue": "guardianNavMatches",
  "guardian.matches.activeProgress": "guardianNavMatches",
  "guardian.points.newEarnings": "guardianNavPoints",
  "guardian.profile.needsRevision": "guardianNavProfile",
};

/** 메뉴 이탈 시 자동 seen(레거시)을 적용하지 않는 메뉴 — 블록 관측/명시적 seen만 사용 */
export const ATTENTION_MENU_KEYS_PARTITIONED_TO_BLOCKS: AttentionMenuKey[] = [
  "navJourneys",
  "navMatches",
  "navPoints",
  "guardianNavPosts",
  "guardianNavMatches",
  "guardianNavPoints",
  "guardianNavProfile",
];

export type MypageHubAttentionView = {
  unreadTravelerNavBadges: Record<TravelerNavBadgeKey, number>;
  unreadGuardianWorkspaceNavBadges: Record<GuardianWorkspaceNavBadgeKey, number>;
  unreadBlockBadges: Record<AttentionBlockKey, number>;
  unreadTravelerBadgeCount: number;
  unreadGuardianBadgeCount: number;
  unreadGlobalAttentionDot: boolean;
};

export type MypageHubContextValue = {
  appRole: AppAccountRole;
  guardianStatus: GuardianProfileStatus;
  accountUserId: string | null;
  snapshot: MypageHubSnapshot;
  attention: MypageHubAttentionView;
  markBlockAttentionSeen: (blockKey: AttentionBlockKey, signature: string) => void;
  /** RSC에서 직렬화한 포인트 시트 초기 payload (없으면 시트만 API로 로드) */
  pointsSheetInitial: MypagePointsApiResponse | null;
};
