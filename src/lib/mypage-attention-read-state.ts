"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AttentionBlockKey,
  AttentionMenuKey,
  MypageHubAttentionView,
  MypageHubSnapshot,
} from "@/types/mypage-hub";
import {
  ATTENTION_BLOCK_KEYS,
  ATTENTION_MENU_KEYS_PARTITIONED_TO_BLOCKS,
  GUARDIAN_WORKSPACE_NAV_BADGE_KEYS,
  TRAVELER_NAV_BADGE_KEYS,
} from "@/types/mypage-hub";
import { computeMypageAttentionViewFromSnapshot } from "@/lib/mypage-attention-unread";
import { sameOriginApiUrl } from "@/lib/api-origin";
import { emitMypageAttentionUpdated } from "@/lib/mypage-attention-events";

const STORAGE_PREFIX = "safemate-mypage-attention-seen-v1";
const BLOCK_STORAGE_PREFIX = "safemate-mypage-block-attention-seen-v1";

const PARTITIONED_MENUS = new Set<AttentionMenuKey>(ATTENTION_MENU_KEYS_PARTITIONED_TO_BLOCKS);

function storageKey(userId: string | null, menuKey: AttentionMenuKey) {
  return `${STORAGE_PREFIX}:${userId ?? "anon"}:${menuKey}`;
}

function blockStorageKey(userId: string | null, blockKey: AttentionBlockKey) {
  return `${BLOCK_STORAGE_PREFIX}:${userId ?? "anon"}:${blockKey}`;
}

function menuFromPathname(pathname: string, hubMode: "traveler" | "guardian"): AttentionMenuKey | null {
  if (pathname === "/mypage" || pathname === "/mypage/") {
    return hubMode === "guardian" ? "guardianNavHome" : "navJourneys";
  }
  if (pathname.startsWith("/mypage/journeys")) return "navJourneys";
  if (pathname === "/mypage/routes" || pathname.startsWith("/mypage/routes/")) return "navMyRoutes";
  if (pathname.startsWith("/mypage/profile")) return "navProfile";
  if (pathname.startsWith("/mypage/points")) return "navPoints";
  if (pathname.startsWith("/mypage/matches")) return "navMatches";
  if (pathname.startsWith("/mypage/guardian/profile")) return "guardianNavProfile";
  if (pathname.startsWith("/mypage/guardian/posts/new")) return "guardianNavNewPost";
  if (pathname.startsWith("/mypage/guardian/posts")) return "guardianNavPosts";
  if (pathname.startsWith("/mypage/guardian/matches")) return "guardianNavMatches";
  if (pathname.startsWith("/mypage/guardian/points")) return "guardianNavPoints";
  if (pathname.startsWith("/mypage/guardian/settings")) return "guardianNavSettings";
  return null;
}

function loadSeenMapFromLocalLegacy(userId: string | null): Partial<Record<AttentionMenuKey, string>> {
  if (typeof window === "undefined") return {};
  const out: Partial<Record<AttentionMenuKey, string>> = {};
  const keys: AttentionMenuKey[] = [...TRAVELER_NAV_BADGE_KEYS, ...GUARDIAN_WORKSPACE_NAV_BADGE_KEYS];
  for (const k of keys) {
    const v = window.localStorage.getItem(storageKey(userId, k));
    if (v) out[k] = v;
  }
  return out;
}

function loadBlockSeenFromLocal(userId: string | null): Partial<Record<AttentionBlockKey, string>> {
  if (typeof window === "undefined") return {};
  const out: Partial<Record<AttentionBlockKey, string>> = {};
  for (const k of ATTENTION_BLOCK_KEYS) {
    const v = window.localStorage.getItem(blockStorageKey(userId, k));
    if (v) out[k] = v;
  }
  return out;
}

async function postAttentionSeen(menuKey: AttentionMenuKey, signature: string) {
  await fetch(sameOriginApiUrl("/api/account/attention-seen"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope: "menu", menuKey, signature }),
  });
}

async function postBlockAttentionSeen(blockKey: AttentionBlockKey, signature: string) {
  await fetch(sameOriginApiUrl("/api/account/attention-seen"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope: "block", blockKey, signature }),
  });
}

export type MypageAttentionController = {
  attention: MypageHubAttentionView;
  markBlockAttentionSeen: (blockKey: AttentionBlockKey, signature: string) => void;
};

export function useMypageAttentionView(
  snapshot: MypageHubSnapshot,
  pathname: string,
  userId: string | null,
  hubMode: "traveler" | "guardian",
): MypageAttentionController {
  const [seenMap, setSeenMap] = useState<Partial<Record<AttentionMenuKey, string>>>({});
  const [blockSeenMap, setBlockSeenMap] = useState<Partial<Record<AttentionBlockKey, string>>>({});
  const prevMenuRef = useRef<AttentionMenuKey | null>(null);

  const signatures = useMemo(
    () => ({ ...snapshot.travelerNavSignatures, ...snapshot.guardianWorkspaceNavSignatures }),
    [snapshot],
  );
  const currentMenu = useMemo(() => menuFromPathname(pathname, hubMode), [pathname, hubMode]);

  useEffect(() => {
    if (!userId) {
      setSeenMap({});
      setBlockSeenMap({});
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(sameOriginApiUrl("/api/account/attention-seen"), { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          seen?: Partial<Record<AttentionMenuKey, string>>;
          blockSeen?: Partial<Record<AttentionBlockKey, string>>;
        };
        let nextMenu: Partial<Record<AttentionMenuKey, string>> = { ...(data.seen ?? {}) };
        let nextBlock: Partial<Record<AttentionBlockKey, string>> = { ...(data.blockSeen ?? {}) };

        const legacyMenu = loadSeenMapFromLocalLegacy(userId);
        const allMenuKeys = [...TRAVELER_NAV_BADGE_KEYS, ...GUARDIAN_WORKSPACE_NAV_BADGE_KEYS];
        for (const k of allMenuKeys) {
          const v = legacyMenu[k];
          if (v && !nextMenu[k]) {
            nextMenu = { ...nextMenu, [k]: v };
            void postAttentionSeen(k, v);
          }
        }

        const localBlocks = loadBlockSeenFromLocal(userId);
        for (const [bk, sig] of Object.entries(localBlocks)) {
          if (sig && !nextBlock[bk as AttentionBlockKey]) {
            nextBlock = { ...nextBlock, [bk as AttentionBlockKey]: sig };
            void postBlockAttentionSeen(bk as AttentionBlockKey, sig);
          }
        }

        if (!cancelled) {
          setSeenMap(nextMenu);
          setBlockSeenMap(nextBlock);
          emitMypageAttentionUpdated();
        }
      } catch {
        if (!cancelled) {
          setSeenMap({});
          setBlockSeenMap({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;
    const prev = prevMenuRef.current;
    if (prev && prev !== currentMenu && !PARTITIONED_MENUS.has(prev)) {
      const sig = signatures[prev];
      if (sig) {
        void postAttentionSeen(prev, sig);
        setSeenMap((old) => ({ ...old, [prev]: sig }));
        emitMypageAttentionUpdated();
      }
    }
    prevMenuRef.current = currentMenu;
    return () => {
      const leaving = prevMenuRef.current;
      if (!leaving || !userId || PARTITIONED_MENUS.has(leaving)) return;
      const sig = signatures[leaving];
      if (!sig) return;
      void postAttentionSeen(leaving, sig);
      setSeenMap((old) => ({ ...old, [leaving]: sig }));
      emitMypageAttentionUpdated();
    };
  }, [currentMenu, signatures, userId]);

  const markBlockAttentionSeen = useCallback(
    (blockKey: AttentionBlockKey, signature: string) => {
      if (!userId || !signature) return;
      try {
        window.localStorage.setItem(blockStorageKey(userId, blockKey), signature);
      } catch {
        /* ignore */
      }
      void postBlockAttentionSeen(blockKey, signature);
      setBlockSeenMap((old) => ({ ...old, [blockKey]: signature }));
      emitMypageAttentionUpdated();
    },
    [userId],
  );

  const attention = useMemo(
    () => computeMypageAttentionViewFromSnapshot(snapshot, seenMap, blockSeenMap),
    [snapshot, seenMap, blockSeenMap],
  );

  return { attention, markBlockAttentionSeen };
}
