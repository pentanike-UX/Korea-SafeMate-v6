"use client";

import { MypageBlockSeenBoundary } from "@/components/mypage/mypage-block-seen-boundary";

/** 가디언 포스트 목록 화면에서 검토·초안 블록을 한 번에 관측해 seen 처리 */
export function GuardianPostsPageBlockBoundary({ children }: { children: React.ReactNode }) {
  return (
    <MypageBlockSeenBoundary blockKeys={["guardian.posts.pendingReview", "guardian.posts.drafts"]}>
      {children}
    </MypageBlockSeenBoundary>
  );
}
