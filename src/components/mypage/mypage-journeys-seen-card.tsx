"use client";

import type { AttentionBlockKey } from "@/types/mypage-hub";
import { MypageBlockSeenBoundary } from "@/components/mypage/mypage-block-seen-boundary";
import { cn } from "@/lib/utils";

type Props =
  | { blockKey: AttentionBlockKey; blockKeys?: undefined; children: React.ReactNode; className?: string }
  | { blockKey?: undefined; blockKeys: AttentionBlockKey[]; children: React.ReactNode; className?: string };

/**
 * 여정 허브 전용 페이지 카드 — 허브 스탯 그리드와 동일한 블록 키로 seen 관측.
 */
export function MypageJourneysSeenCard(props: Props) {
  const { children, className } = props;
  if ("blockKeys" in props && props.blockKeys?.length) {
    return (
      <MypageBlockSeenBoundary blockKeys={props.blockKeys} className={cn("h-full", className)}>
        {children}
      </MypageBlockSeenBoundary>
    );
  }
  const bk = "blockKey" in props ? props.blockKey : undefined;
  if (!bk) return <div className={cn("h-full", className)}>{children}</div>;
  return (
    <MypageBlockSeenBoundary blockKey={bk} className={cn("h-full", className)}>
      {children}
    </MypageBlockSeenBoundary>
  );
}
