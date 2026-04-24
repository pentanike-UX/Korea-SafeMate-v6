"use client";

import { useTranslations } from "next-intl";
import { BlockAttentionBadge } from "@/components/mypage/mypage-attention-primitives";
import { useMypageHubContext } from "@/components/mypage/mypage-hub-context";

export function GuardianPostsAttentionStrip() {
  const t = useTranslations("TravelerHub");
  const ctx = useMypageHubContext();
  const g = ctx?.snapshot.guardianWorkspaceBlockAttention;
  if (!g) return null;
  const uPending = ctx?.attention.unreadBlockBadges["guardian.posts.pendingReview"] ?? 0;
  const uDrafts = ctx?.attention.unreadBlockBadges["guardian.posts.drafts"] ?? 0;
  if (uPending < 1 && uDrafts < 1) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {uPending > 0 ? (
        <BlockAttentionBadge count={uPending} ariaLabel={t("attentionGuardianPostsPending")} />
      ) : null}
      {uDrafts > 0 ? (
        <BlockAttentionBadge count={uDrafts} ariaLabel={t("attentionGuardianPostsDraft")} />
      ) : null}
    </div>
  );
}
