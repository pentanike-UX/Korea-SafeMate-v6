"use client";

import { useTranslations } from "next-intl";
import type { StoredMatchRequest } from "@/lib/traveler-match-requests";
import { TravelerMatchCompleteButton } from "@/components/mypage/match-request-row-actions";
import { TravelerReviewSubmitSheet } from "@/components/mypage/traveler-review-submit-sheet";
import { MypageGuardianProfileSheetTrigger } from "@/components/mypage/mypage-guardian-profile-sheet-trigger";
import { TravelerMatchDetailSheetTrigger } from "@/components/mypage/traveler-match-detail-sheet";

export function MypageMatchRowActions({
  row,
  showComplete,
  reviewedMatchIds,
  canWriteTravelerReview,
}: {
  row: StoredMatchRequest;
  showComplete: boolean;
  reviewedMatchIds: string[];
  canWriteTravelerReview: boolean;
}) {
  const t = useTranslations("TravelerHub");
  const already = reviewedMatchIds.includes(row.id);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <TravelerMatchDetailSheetTrigger
        row={row}
        triggerLabel={t("matchViewDetail")}
        alreadyReviewed={already}
        canWriteTravelerReview={canWriteTravelerReview}
        className="h-9 rounded-lg"
      />
      {/* postContext 없음: 매칭 행에는 포스트 id/요약이 없어 의도적 */}
      <MypageGuardianProfileSheetTrigger
        guardian={{
          user_id: row.guardian_user_id,
          display_name: row.guardian_display_name || row.guardian_user_id,
          headline: t("matchesPageLead"),
          photo_url: null,
        }}
        triggerLabel={t("openGuardian")}
      />
      {showComplete && row.status === "accepted" ? <TravelerMatchCompleteButton matchId={row.id} /> : null}
      {row.status === "completed" ? (
        <TravelerReviewSubmitSheet
          matchId={row.id}
          guardianDisplayName={row.guardian_display_name || row.guardian_user_id}
          alreadyReviewed={already}
          disabled={!canWriteTravelerReview}
          disabledReason={canWriteTravelerReview ? undefined : t("reviewFormDisabled")}
        />
      ) : null}
    </div>
  );
}
