"use client";

import { MypageBlockSeenBoundary } from "@/components/mypage/mypage-block-seen-boundary";

export function GuardianProfileNeedsRevisionBoundary({ children }: { children: React.ReactNode }) {
  return <MypageBlockSeenBoundary blockKey="guardian.profile.needsRevision">{children}</MypageBlockSeenBoundary>;
}
