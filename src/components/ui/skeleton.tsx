import { cn } from "@/lib/utils";

/**
 * Skeleton — 로딩 플레이스홀더
 * Foundation §4.1: 스피너 단독 사용 금지, Skeleton으로 대체
 * 사용: <Skeleton className="h-4 w-48" />
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn("animate-pulse rounded-[var(--radius-sm)] bg-bg-sunken", className)}
      {...props}
    />
  );
}

/** 텍스트 한 줄 플레이스홀더 */
function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-4 w-full", className)} {...props} />;
}

/** 제목 플레이스홀더 */
function SkeletonTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-6 w-2/3", className)} {...props} />;
}

/** 아바타/이미지 원형 플레이스홀더 */
function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("size-10 rounded-full", className)} {...props} />;
}

/** 카드 전체 플레이스홀더 */
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3 rounded-[var(--radius-lg)] border border-line bg-bg-card p-4", className)} {...props}>
      <Skeleton className="h-40 w-full rounded-[var(--radius-md)]" />
      <SkeletonTitle />
      <SkeletonText className="w-full" />
      <SkeletonText className="w-4/5" />
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonTitle, SkeletonAvatar, SkeletonCard };
