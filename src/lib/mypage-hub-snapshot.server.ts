import { mockBookings } from "@/data/mock/bookings";
import { getGuardianSeedBundle } from "@/data/mock/guardian-seed-bundle";
import { mockTravelerTripRequests } from "@/data/mock/traveler-hub";
import type { AppAccountRole } from "@/lib/auth/app-role";
import type { GuardianProfileStatus } from "@/lib/auth/guardian-profile-status";
import { isMockGuardianId } from "@/lib/dev/mock-guardian-auth";
import { fetchBalanceSnapshot, fetchLedgerAttentionSignals } from "@/lib/points/point-ledger-service";
import { getMatchRequestsForGuardian, getMatchRequestsForTraveler } from "@/lib/traveler-match-requests.server";
import { getTravelerSavedGuardianIdsUnified, getTravelerSavedPostIdsUnified } from "@/lib/traveler-saved-unified.server";
import { getSubmittedTravelerReviewsFromCookie } from "@/lib/traveler-submitted-reviews.server";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import type { ContentPostStatus } from "@/types/domain";
import type {
  AttentionBlockKey,
  GuardianWorkspaceBlockAttention,
  GuardianWorkspaceNavBadgeKey,
  MypageHubSnapshot,
  TravelerBlockAttention,
  TravelerNavBadgeKey,
} from "@/types/mypage-hub";
import {
  ATTENTION_BLOCK_KEYS,
  GUARDIAN_WORKSPACE_NAV_BADGE_KEYS,
  TRAVELER_NAV_BADGE_KEYS,
} from "@/types/mypage-hub";

const RECENT_LEDGER_DAYS = 7;

function emptyTravelerNav(): Record<TravelerNavBadgeKey, number> {
  return TRAVELER_NAV_BADGE_KEYS.reduce(
    (acc, k) => {
      acc[k] = 0;
      return acc;
    },
    {} as Record<TravelerNavBadgeKey, number>,
  );
}

function emptyGuardianWorkspaceNav(): Record<GuardianWorkspaceNavBadgeKey, number> {
  return GUARDIAN_WORKSPACE_NAV_BADGE_KEYS.reduce(
    (acc, k) => {
      acc[k] = 0;
      return acc;
    },
    {} as Record<GuardianWorkspaceNavBadgeKey, number>,
  );
}

function emptyTravelerNavSignatures(): Record<TravelerNavBadgeKey, string> {
  return TRAVELER_NAV_BADGE_KEYS.reduce(
    (acc, k) => {
      acc[k] = "0";
      return acc;
    },
    {} as Record<TravelerNavBadgeKey, string>,
  );
}

function emptyGuardianWorkspaceNavSignatures(): Record<GuardianWorkspaceNavBadgeKey, string> {
  return GUARDIAN_WORKSPACE_NAV_BADGE_KEYS.reduce(
    (acc, k) => {
      acc[k] = "0";
      return acc;
    },
    {} as Record<GuardianWorkspaceNavBadgeKey, string>,
  );
}

function buildBlockAttentionMaps(input: {
  openTrip: number;
  savedGuardianCount: number;
  savedGuardianIds: string;
  savedPostCount: number;
  savedPostIds: string;
  matchPending: number;
  matchPendingIds: string;
  matchReviewDue: number;
  matchReviewIds: string;
  pointsRecentLedgerCount: number;
  pointsLedgerHeadId: string;
  inboundReviewSignals: number;
  guardian: GuardianWorkspaceBlockAttention | null;
  profileNeedsRevisionRaw: number;
  profileNeedsRevisionSig: string;
}): {
  blockAttentionCounts: Record<AttentionBlockKey, number>;
  blockAttentionSignatures: Record<AttentionBlockKey, string>;
} {
  const blockAttentionCounts = {} as Record<AttentionBlockKey, number>;
  const blockAttentionSignatures = {} as Record<AttentionBlockKey, string>;
  for (const k of ATTENTION_BLOCK_KEYS) {
    blockAttentionCounts[k] = 0;
    blockAttentionSignatures[k] = "0";
  }

  blockAttentionCounts["traveler.journeys.openTrips"] = input.openTrip;
  blockAttentionSignatures["traveler.journeys.openTrips"] = `traveler.journeys.openTrips:n=${input.openTrip}`;

  blockAttentionCounts["traveler.journeys.savedGuardians"] = input.savedGuardianCount;
  blockAttentionSignatures["traveler.journeys.savedGuardians"] =
    `traveler.journeys.savedGuardians:n=${input.savedGuardianCount}:ids=${input.savedGuardianIds}`;

  blockAttentionCounts["traveler.journeys.savedPosts"] = input.savedPostCount;
  blockAttentionSignatures["traveler.journeys.savedPosts"] =
    `traveler.journeys.savedPosts:n=${input.savedPostCount}:ids=${input.savedPostIds}`;

  blockAttentionCounts["traveler.matches.newResponses"] = input.matchPending;
  blockAttentionSignatures["traveler.matches.newResponses"] =
    `traveler.matches.newResponses:n=${input.matchPending}:ids=${input.matchPendingIds}`;

  blockAttentionCounts["traveler.matches.reviewDue"] = input.matchReviewDue;
  blockAttentionSignatures["traveler.matches.reviewDue"] =
    `traveler.matches.reviewDue:n=${input.matchReviewDue}:ids=${input.matchReviewIds}`;

  blockAttentionCounts["traveler.points.newEarnings"] = input.pointsRecentLedgerCount;
  blockAttentionSignatures["traveler.points.newEarnings"] =
    `traveler.points.newEarnings:n=${input.pointsRecentLedgerCount}:head=${input.pointsLedgerHeadId}`;

  blockAttentionCounts["traveler.reviews.newInbound"] = input.inboundReviewSignals;
  blockAttentionSignatures["traveler.reviews.newInbound"] =
    `traveler.reviews.newInbound:n=${input.inboundReviewSignals}`;

  const g = input.guardian;
  if (g) {
    blockAttentionCounts["guardian.posts.pendingReview"] = g.postsPendingReview;
    blockAttentionSignatures["guardian.posts.pendingReview"] =
      `guardian.posts.pendingReview:n=${g.postsPendingReview}`;

    blockAttentionCounts["guardian.posts.drafts"] = g.postsDrafts;
    blockAttentionSignatures["guardian.posts.drafts"] = `guardian.posts.drafts:n=${g.postsDrafts}`;

    blockAttentionCounts["guardian.matches.newRequests"] = g.incomingMatchRequests;
    blockAttentionSignatures["guardian.matches.newRequests"] =
      `guardian.matches.newRequests:n=${g.incomingMatchRequests}`;

    const reviewQ = g.bookingsReviewing + g.openPoolSignal;
    blockAttentionCounts["guardian.matches.reviewQueue"] = reviewQ;
    blockAttentionSignatures["guardian.matches.reviewQueue"] =
      `guardian.matches.reviewQueue:reviewing=${g.bookingsReviewing}:pool=${g.openPoolSignal}`;

    blockAttentionCounts["guardian.matches.activeProgress"] = g.inProgressBookings;
    blockAttentionSignatures["guardian.matches.activeProgress"] =
      `guardian.matches.activeProgress:n=${g.inProgressBookings}`;

    blockAttentionCounts["guardian.points.newEarnings"] = g.pointsRecentLedgerCount;
    blockAttentionSignatures["guardian.points.newEarnings"] =
      `guardian.points.newEarnings:n=${g.pointsRecentLedgerCount}:head=${input.pointsLedgerHeadId}`;
  }

  blockAttentionCounts["guardian.profile.needsRevision"] = input.profileNeedsRevisionRaw;
  blockAttentionSignatures["guardian.profile.needsRevision"] = input.profileNeedsRevisionSig;

  return { blockAttentionCounts, blockAttentionSignatures };
}

export async function getMypageHubSnapshot(
  userId: string | null,
  appRole: AppAccountRole,
  guardianStatus: GuardianProfileStatus,
): Promise<MypageHubSnapshot> {
  const sb = createServiceRoleSupabase();
  const useMockTrip = !userId || isMockGuardianId(userId);
  const matchRows = userId ? await getMatchRequestsForTraveler(userId) : [];
  /** 실사용: 별도 trip_requests 테이블 없이 «응답 대기 매칭」 건수를 오픈 파이프라인으로 집계 */
  const openTrip = useMockTrip
    ? mockTravelerTripRequests.filter((r) => r.status === "requested" || r.status === "reviewing").length
    : matchRows.filter((m) => m.status === "requested").length;

  const savedGuardianIdsSorted = userId ? [...(await getTravelerSavedGuardianIdsUnified(userId))].sort() : [];
  const savedPostIdsSorted = userId ? [...(await getTravelerSavedPostIdsUnified(userId))].sort() : [];
  const matchPending = matchRows.filter((m) => m.status === "requested").length;
  const matchAccepted = matchRows.filter((m) => m.status === "accepted").length;

  const submittedReviews = userId ? await getSubmittedTravelerReviewsFromCookie() : [];
  const reviewedMatchIds = new Set<string>();
  for (const s of submittedReviews) {
    if (s.booking_id) reviewedMatchIds.add(s.booking_id);
    if (s.id) reviewedMatchIds.add(s.id);
  }
  const matchReviewDue = matchRows.filter(
    (m) => m.status === "completed" && !reviewedMatchIds.has(m.id),
  ).length;

  let pointsRecentLedgerCount = 0;
  let pointsLedgerHeadId = "";
  if (userId && !isMockGuardianId(userId)) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - RECENT_LEDGER_DAYS);
    const signals = await fetchLedgerAttentionSignals(userId, since.toISOString());
    pointsRecentLedgerCount = signals.recentCount;
    pointsLedgerHeadId = signals.latestEntryId;
  }

  const travelerNavBadges = emptyTravelerNav();
  const travelerNavSignatures = emptyTravelerNavSignatures();
  /** 여정(mock) 파이프라인 + 저장 목록 변화 — LNB 「내 여정」 */
  const journeySavedSignal =
    savedGuardianIdsSorted.length > 0 || savedPostIdsSorted.length > 0 ? 1 : 0;
  travelerNavBadges.navJourneys = openTrip + journeySavedSignal;
  /** 매칭 쿠키 — 응답 대기 + 리뷰 미작성 완료 */
  travelerNavBadges.navMatches = matchPending + matchReviewDue;
  /** 포인트 원장 최근 활동 */
  travelerNavBadges.navPoints = pointsRecentLedgerCount;
  travelerNavBadges.navProfile = 0;
  travelerNavSignatures.navProfile = "profile:none";
  travelerNavSignatures.navJourneys = `journeys:open=${openTrip}:savedG=${savedGuardianIdsSorted.join("|")}:savedP=${savedPostIdsSorted.join("|")}`;
  travelerNavSignatures.navMatches = `matches:pending=${matchPending}:reviewDue=${matchReviewDue}:ids=${matchRows
    .map((m) => `${m.id}:${m.status}:${m.updated_at}`)
    .join("|")}`;
  travelerNavSignatures.navPoints = `points:recent=${pointsRecentLedgerCount}`;
  travelerNavSignatures.navMyRoutes = "routes:list";

  const travelerBadgeCount = TRAVELER_NAV_BADGE_KEYS.reduce((s, k) => s + travelerNavBadges[k], 0);

  const inboundReviewSignals = 0;
  const travelerBlockAttention: TravelerBlockAttention = {
    openTripRequests: openTrip,
    matches: {
      pending: matchPending,
      reviewDue: matchReviewDue,
      accepted: matchAccepted,
    },
    pointsRecentLedgerCount,
    savedGuardianCount: savedGuardianIdsSorted.length,
    savedPostCount: savedPostIdsSorted.length,
    inboundReviewSignals,
  };

  const pendingMatchIds = matchRows.filter((m) => m.status === "requested").map((m) => m.id).join("|");
  const reviewDueMatchIds = matchRows
    .filter((m) => m.status === "completed" && !reviewedMatchIds.has(m.id))
    .map((m) => m.id)
    .join("|");

  const guardianSegmentUnlocked = appRole === "guardian" || guardianStatus !== "none";

  if (!guardianSegmentUnlocked) {
    const { blockAttentionCounts, blockAttentionSignatures } = buildBlockAttentionMaps({
      openTrip,
      savedGuardianCount: savedGuardianIdsSorted.length,
      savedGuardianIds: savedGuardianIdsSorted.join("|"),
      savedPostCount: savedPostIdsSorted.length,
      savedPostIds: savedPostIdsSorted.join("|"),
      matchPending,
      matchPendingIds: pendingMatchIds,
      matchReviewDue,
      matchReviewIds: reviewDueMatchIds,
      pointsRecentLedgerCount,
      pointsLedgerHeadId,
      inboundReviewSignals,
      guardian: null,
      profileNeedsRevisionRaw: 0,
      profileNeedsRevisionSig: "guardian.profile.needsRevision:ok",
    });
    return {
      travelerBadgeCount,
      guardianBadgeCount: 0,
      guardianSegmentUnlocked: false,
      guardianOps: null,
      globalAttentionDot: travelerBadgeCount > 0,
      travelerNavBadges,
      travelerNavSignatures,
      guardianWorkspaceNavBadges: emptyGuardianWorkspaceNav(),
      guardianWorkspaceNavSignatures: emptyGuardianWorkspaceNavSignatures(),
      travelerBlockAttention,
      guardianWorkspaceBlockAttention: null,
      blockAttentionCounts,
      blockAttentionSignatures,
    };
  }

  let guardianBadgeCount = 0;
  let guardianOps: MypageHubSnapshot["guardianOps"] = null;
  const guardianWorkspaceNavBadges = emptyGuardianWorkspaceNav();
  const guardianWorkspaceNavSignatures = emptyGuardianWorkspaceNavSignatures();
  let guardianWorkspaceBlockAttention: GuardianWorkspaceBlockAttention | null = null;

  if (guardianStatus === "submitted" || guardianStatus === "rejected" || guardianStatus === "suspended") {
    guardianBadgeCount = 1;
    guardianWorkspaceNavBadges.guardianNavProfile = 1;
    guardianWorkspaceNavSignatures.guardianNavProfile = `guardianStatus:${guardianStatus}`;
  }
  if (guardianStatus === "draft") {
    guardianBadgeCount = 1;
    guardianWorkspaceNavBadges.guardianNavProfile = 1;
    guardianWorkspaceNavSignatures.guardianNavProfile = "guardianStatus:draft";
  }

  if (guardianStatus === "approved" && userId) {
    const bundle = getGuardianSeedBundle();
    let postRows: Array<{ id: string; title: string; status: ContentPostStatus; created_at: string }> = bundle.posts
      .filter((p) => p.author_user_id === userId)
      .map((p) => ({ id: p.id, title: p.title ?? "", status: p.status, created_at: p.created_at }));
    if (!isMockGuardianId(userId) && sb) {
      const { data: dbPosts } = await sb
        .from("content_posts")
        .select("id, title, status, created_at")
        .eq("author_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(120);
      if (dbPosts && dbPosts.length > 0) {
        postRows = dbPosts.map((p) => ({
          id: p.id,
          title: p.title ?? "",
          status:
            p.status === "approved" || p.status === "pending" || p.status === "draft"
              ? p.status
              : "rejected",
          created_at: p.created_at ?? new Date().toISOString(),
        }));
      }
    }
    const pendingPosts = postRows.filter((p) => p.status === "pending").length;
    const draftPosts = postRows.filter((p) => p.status === "draft").length;
    let reviewingBookings = mockBookings.filter((b) => b.guardian_user_id === userId && b.status === "reviewing").length;
    let inProgressBookings = mockBookings.filter(
      (b) =>
        b.guardian_user_id === userId &&
        (b.status === "in_progress" || b.status === "matched" || b.status === "confirmed"),
    ).length;
    let completedBookings = mockBookings.filter((b) => b.guardian_user_id === userId && b.status === "completed").length;
    let openPoolCount = mockBookings.filter((b) => b.guardian_user_id == null && b.status === "reviewing").length;
    if (!isMockGuardianId(userId) && sb) {
      const [{ data: myBookings }, { data: poolBookings }] = await Promise.all([
        sb
          .from("bookings")
          .select("status")
          .eq("guardian_user_id", userId)
          .limit(200),
        sb
          .from("bookings")
          .select("id")
          .is("guardian_user_id", null)
          .eq("status", "reviewing")
          .limit(1),
      ]);
      if (myBookings) {
        reviewingBookings = myBookings.filter((b) => b.status === "reviewing").length;
        inProgressBookings = myBookings.filter((b) =>
          b.status === "in_progress" || b.status === "matched" || b.status === "confirmed",
        ).length;
        completedBookings = myBookings.filter((b) => b.status === "completed").length;
      }
      openPoolCount = poolBookings?.length ? 1 : 0;
    }
    let points: number | null;
    if (isMockGuardianId(userId)) {
      points = bundle.pointsByAuthorId[userId] ?? null;
    } else {
      const bal = await fetchBalanceSnapshot(userId);
      points = bal?.balance ?? 0;
    }
    const recentPosts = [...postRows]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title?.trim() || "",
        status: p.status,
        updatedAt: p.created_at,
      }));

    guardianOps = {
      pendingPosts,
      draftPosts,
      reviewingBookings,
      inProgressBookings,
      completedBookings,
      openPoolCount,
      points,
      recentPosts,
    };

    const guardianMatchRows = await getMatchRequestsForGuardian(userId);
    const incomingMatchRequests = guardianMatchRows.filter((r) => r.status === "requested").length;
    const poolSignal = openPoolCount > 0 ? 1 : 0;

    guardianWorkspaceNavBadges.guardianNavHome = 0;
    guardianWorkspaceNavBadges.guardianNavPosts = pendingPosts + (draftPosts > 0 ? 1 : 0);
    guardianWorkspaceNavBadges.guardianNavMatches = incomingMatchRequests + reviewingBookings + poolSignal;
    guardianWorkspaceNavBadges.guardianNavProfile = 0;
    guardianWorkspaceNavBadges.guardianNavNewPost = 0;
    guardianWorkspaceNavBadges.guardianNavPoints = 0;
    guardianWorkspaceNavBadges.guardianNavSettings = 0;
    guardianWorkspaceNavSignatures.guardianNavHome = "guardianHome:none";
    guardianWorkspaceNavSignatures.guardianNavProfile = "guardianProfile:none";
    guardianWorkspaceNavSignatures.guardianNavNewPost = "guardianNewPost:none";
    guardianWorkspaceNavSignatures.guardianNavPoints = "guardianPoints:none";
    guardianWorkspaceNavSignatures.guardianNavSettings = "guardianSettings:none";
    guardianWorkspaceNavSignatures.guardianNavPosts = `guardianPosts:pending=${pendingPosts}:draft=${draftPosts}:recent=${recentPosts
      .map((p) => `${p.id}:${p.status}:${p.updatedAt}`)
      .join("|")}`;
    guardianWorkspaceNavSignatures.guardianNavMatches = `guardianMatches:incoming=${incomingMatchRequests}:reviewing=${reviewingBookings}:pool=${poolSignal}`;

    guardianWorkspaceBlockAttention = {
      incomingMatchRequests,
      bookingsReviewing: reviewingBookings,
      openPoolSignal: poolSignal,
      postsPendingReview: pendingPosts,
      postsDrafts: draftPosts,
      inProgressBookings,
      pointsRecentLedgerCount,
    };

    guardianBadgeCount = Math.min(
      99,
      GUARDIAN_WORKSPACE_NAV_BADGE_KEYS.reduce((s, k) => s + guardianWorkspaceNavBadges[k], 0),
    );
  }

  const profileRaw = guardianWorkspaceNavBadges.guardianNavProfile;
  const profileSig = guardianWorkspaceNavSignatures.guardianNavProfile;
  const { blockAttentionCounts, blockAttentionSignatures } = buildBlockAttentionMaps({
    openTrip,
    savedGuardianCount: savedGuardianIdsSorted.length,
    savedGuardianIds: savedGuardianIdsSorted.join("|"),
    savedPostCount: savedPostIdsSorted.length,
    savedPostIds: savedPostIdsSorted.join("|"),
    matchPending,
    matchPendingIds: pendingMatchIds,
    matchReviewDue,
    matchReviewIds: reviewDueMatchIds,
    pointsRecentLedgerCount,
    pointsLedgerHeadId,
    inboundReviewSignals,
    guardian: guardianWorkspaceBlockAttention,
    profileNeedsRevisionRaw: profileRaw,
    profileNeedsRevisionSig:
      profileRaw > 0 ? `guardian.profile.needsRevision:${profileSig}` : "guardian.profile.needsRevision:ok",
  });

  return {
    travelerBadgeCount,
    guardianBadgeCount,
    guardianSegmentUnlocked,
    guardianOps,
    globalAttentionDot: travelerBadgeCount > 0 || guardianBadgeCount > 0,
    travelerNavBadges,
    travelerNavSignatures,
    guardianWorkspaceNavBadges,
    guardianWorkspaceNavSignatures,
    travelerBlockAttention,
    guardianWorkspaceBlockAttention,
    blockAttentionCounts,
    blockAttentionSignatures,
  };
}
