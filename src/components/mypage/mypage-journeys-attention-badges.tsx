"use client";

import { useTranslations } from "next-intl";
import { BlockAttentionBadge } from "@/components/mypage/mypage-attention-primitives";
import { useMypageHubContext } from "@/components/mypage/mypage-hub-context";

export function MypageJourneysOpenTripBadge() {
  const t = useTranslations("TravelerHub");
  const ctx = useMypageHubContext();
  const n = ctx?.snapshot.travelerBlockAttention.openTripRequests ?? 0;
  const u = ctx?.attention.unreadBlockBadges["traveler.journeys.openTrips"] ?? 0;
  if (n < 1 || u < 1) return null;
  return <BlockAttentionBadge count={u} ariaLabel={t("attentionBlockOpenTrips")} />;
}

export function MypageJourneysMatchHubBadge() {
  const t = useTranslations("TravelerHub");
  const ctx = useMypageHubContext();
  const m = ctx?.snapshot.travelerBlockAttention.matches;
  const uPending = ctx?.attention.unreadBlockBadges["traveler.matches.newResponses"] ?? 0;
  const uReview = ctx?.attention.unreadBlockBadges["traveler.matches.reviewDue"] ?? 0;
  const u = uPending + uReview;
  const matchAttention = (m?.pending ?? 0) + (m?.reviewDue ?? 0);
  if (matchAttention < 1 || u < 1) return null;
  return (
    <BlockAttentionBadge
      count={u}
      ariaLabel={`${t("attentionBlockMatchesPending")} / ${t("attentionBlockMatchesReview")}`}
    />
  );
}
