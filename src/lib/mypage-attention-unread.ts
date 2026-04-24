import type {
  AttentionBlockKey,
  AttentionMenuKey,
  GuardianWorkspaceNavBadgeKey,
  MypageHubAttentionView,
  MypageHubSnapshot,
  TravelerNavBadgeKey,
} from "@/types/mypage-hub";
import {
  ATTENTION_BLOCK_KEYS,
  ATTENTION_BLOCK_PARENT_MENU,
  ATTENTION_MENU_KEYS_PARTITIONED_TO_BLOCKS,
  GUARDIAN_WORKSPACE_NAV_BADGE_KEYS,
  TRAVELER_NAV_BADGE_KEYS,
} from "@/types/mypage-hub";

function countUnread(raw: number, sig: string, seenSig: string | undefined) {
  return raw > 0 && seenSig !== sig ? raw : 0;
}

const PARTITIONED_MENU_SET = new Set<AttentionMenuKey>(ATTENTION_MENU_KEYS_PARTITIONED_TO_BLOCKS);

function sumUnreadBlocksForMenu(
  menu: AttentionMenuKey,
  unreadBlockBadges: Record<AttentionBlockKey, number>,
): number {
  let s = 0;
  for (const bk of ATTENTION_BLOCK_KEYS) {
    if (ATTENTION_BLOCK_PARENT_MENU[bk] === menu) {
      s += unreadBlockBadges[bk];
    }
  }
  return s;
}

/** 서버·클라이언트 공통: 스냅샷 + 메뉴/블록 seen 시그니처로 unread 뷰 계산 */
export function computeMypageAttentionViewFromSnapshot(
  snapshot: MypageHubSnapshot,
  menuSeenMap: Partial<Record<AttentionMenuKey, string>>,
  blockSeenMap: Partial<Record<AttentionBlockKey, string>>,
): MypageHubAttentionView {
  const unreadBlockBadges = {} as Record<AttentionBlockKey, number>;
  for (const k of ATTENTION_BLOCK_KEYS) {
    const raw = snapshot.blockAttentionCounts[k];
    const sig = snapshot.blockAttentionSignatures[k];
    unreadBlockBadges[k] = countUnread(raw, sig, blockSeenMap[k]);
  }

  const unreadTravelerNavBadges = {} as Record<TravelerNavBadgeKey, number>;
  for (const k of TRAVELER_NAV_BADGE_KEYS) {
    if (PARTITIONED_MENU_SET.has(k)) {
      unreadTravelerNavBadges[k] = sumUnreadBlocksForMenu(k, unreadBlockBadges);
    } else {
      unreadTravelerNavBadges[k] = countUnread(
        snapshot.travelerNavBadges[k],
        snapshot.travelerNavSignatures[k],
        menuSeenMap[k],
      );
    }
  }

  const unreadGuardianWorkspaceNavBadges = {} as Record<GuardianWorkspaceNavBadgeKey, number>;
  for (const k of GUARDIAN_WORKSPACE_NAV_BADGE_KEYS) {
    if (PARTITIONED_MENU_SET.has(k)) {
      unreadGuardianWorkspaceNavBadges[k] = sumUnreadBlocksForMenu(k, unreadBlockBadges);
    } else {
      unreadGuardianWorkspaceNavBadges[k] = countUnread(
        snapshot.guardianWorkspaceNavBadges[k],
        snapshot.guardianWorkspaceNavSignatures[k],
        menuSeenMap[k],
      );
    }
  }

  const unreadTravelerBadgeCount = TRAVELER_NAV_BADGE_KEYS.reduce((s, k) => s + unreadTravelerNavBadges[k], 0);
  const unreadGuardianBadgeCount = GUARDIAN_WORKSPACE_NAV_BADGE_KEYS.reduce(
    (s, k) => s + unreadGuardianWorkspaceNavBadges[k],
    0,
  );

  return {
    unreadTravelerNavBadges,
    unreadGuardianWorkspaceNavBadges,
    unreadBlockBadges,
    unreadTravelerBadgeCount,
    unreadGuardianBadgeCount,
    unreadGlobalAttentionDot: unreadTravelerBadgeCount > 0 || unreadGuardianBadgeCount > 0,
  };
}
