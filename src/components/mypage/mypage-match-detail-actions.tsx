"use client";

import { useTranslations } from "next-intl";
import type { StoredMatchRequest } from "@/lib/traveler-match-requests";
import { TravelerMatchCompleteButton } from "@/components/mypage/match-request-row-actions";
import { TravelerReviewSubmitSheet } from "@/components/mypage/traveler-review-submit-sheet";
import { MypageGuardianProfileSheetTrigger } from "@/components/mypage/mypage-guardian-profile-sheet-trigger";

export function MypageMatchDetailActions({
  row,
  canWriteTravelerReview,
  alreadyReviewed,
}: {
  row: StoredMatchRequest;
  canWriteTravelerReview: boolean;
  alreadyReviewed: boolean;
}) {
  const t = useTranslations("TravelerHub");

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {/* postContext 없음: 매칭 상세에는 연결 포스트 맥락 미보유 시 의도적 */}
      <MypageGuardianProfileSheetTrigger
        guardian={{
          user_id: row.guardian_user_id,
          display_name: row.guardian_display_name || row.guardian_user_id,
          headline: t("matchesPageLead"),
          photo_url: null,
        }}
        triggerLabel={t("openGuardian")}
        triggerVariant="default"
      />
      {row.status === "accepted" ? <TravelerMatchCompleteButton matchId={row.id} /> : null}
      {row.status === "completed" ? (
        <TravelerReviewSubmitSheet
          matchId={row.id}
          guardianDisplayName={row.guardian_display_name || row.guardian_user_id}
          alreadyReviewed={alreadyReviewed}
          disabled={!canWriteTravelerReview}
          disabledReason={canWriteTravelerReview ? undefined : t("reviewFormDisabled")}
        />
      ) : null}
    </div>
  );
}
