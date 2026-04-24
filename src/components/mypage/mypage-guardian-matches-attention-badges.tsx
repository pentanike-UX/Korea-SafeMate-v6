"use client";

import { useTranslations } from "next-intl";
import { BlockAttentionBadge } from "@/components/mypage/mypage-attention-primitives";
import { useMypageHubContext } from "@/components/mypage/mypage-hub-context";

export function GuardianMatchesPendingBadge({ count }: { count: number }) {
  const t = useTranslations("TravelerHub");
  const ctx = useMypageHubContext();
  const u = ctx?.attention.unreadBlockBadges["guardian.matches.newRequests"] ?? 0;
  if (count < 1 || u < 1) return null;
  return <BlockAttentionBadge count={u} ariaLabel={t("attentionGuardianMatchIncoming")} />;
}

export function GuardianMatchesActiveBadge({ count }: { count: number }) {
  const t = useTranslations("TravelerHub");
  const ctx = useMypageHubContext();
  const u = ctx?.attention.unreadBlockBadges["guardian.matches.activeProgress"] ?? 0;
  if (count < 1 || u < 1) return null;
  return <BlockAttentionBadge count={u} ariaLabel={t("attentionBlockMatchesActive")} />;
}
