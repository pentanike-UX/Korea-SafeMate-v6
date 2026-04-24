"use client";

import { usePathname } from "@/i18n/navigation";
import type { AttentionBlockKey } from "@/types/mypage-hub";
import { MypageBlockSeenBoundary } from "@/components/mypage/mypage-block-seen-boundary";
import { cn } from "@/lib/utils";

/**
 * 포인트 전용 페이지 본문 — 여행자/가디언 경로에 맞는 points 블록으로 뷰포트 seen.
 */
export function MypagePointsPageSeenBoundary({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const blockKey: AttentionBlockKey = pathname.includes("/mypage/guardian")
    ? "guardian.points.newEarnings"
    : "traveler.points.newEarnings";
  return (
    <MypageBlockSeenBoundary blockKey={blockKey} className={cn(className)}>
      {children}
    </MypageBlockSeenBoundary>
  );
}
