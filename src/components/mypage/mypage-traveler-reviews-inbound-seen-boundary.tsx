"use client";

import { MypageBlockSeenBoundary } from "@/components/mypage/mypage-block-seen-boundary";

/**
 * 여행자 인바운드 리뷰/피드백 블록(`traveler.reviews.newInbound`) — 스냅샷 값이 0이면 관측기가 조기 종료.
 * 완료 매치·리뷰 영역 등 실제 UI가 붙을 때 그대로 감싸면 된다.
 */
export function MypageTravelerReviewsInboundSeenBoundary({ children }: { children: React.ReactNode }) {
  return <MypageBlockSeenBoundary blockKey="traveler.reviews.newInbound">{children}</MypageBlockSeenBoundary>;
}
