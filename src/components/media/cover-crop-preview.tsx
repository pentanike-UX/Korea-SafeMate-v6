"use client";

import { cn } from "@/lib/utils";

/**
 * 업로드/URL 입력 후 미리보기 — 서비스의 `object-cover`와 동일한 잘림을 보여 주기 위한 프레임.
 * (포스트 상세 히어로처럼 의도적으로 옅게·혼합(blend)되는 영역은 이 컴포넌트 대상이 아님.)
 */
export function CoverCropPreview({
  src,
  containerClassName,
  imgClassName,
  emptyLabel,
  caption,
  roundedFull,
  safeFrame,
}: {
  src: string;
  containerClassName: string;
  /** `object-cover` + 서비스와 동일한 `object-*` 정렬 */
  imgClassName: string;
  emptyLabel: string;
  caption?: string;
  roundedFull?: boolean;
  /** 중앙·주요 피사체 안내용 점선 프레임(법적 영역이 아닌 UX 힌트) */
  safeFrame?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "border-border/70 bg-muted/40 relative overflow-hidden border",
          roundedFull ? "rounded-full" : "rounded-[var(--radius-md)]",
          containerClassName,
        )}
      >
        {src ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user URLs for preview */}
            <img src={src} alt="" className={cn("absolute inset-0 size-full min-h-0 min-w-0", imgClassName)} />
            {safeFrame ? (
              <div
                className="pointer-events-none absolute inset-[10%] rounded-sm border border-dashed border-white/55 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
                aria-hidden
              />
            ) : null}
          </>
        ) : (
          <div className="text-muted-foreground flex size-full min-h-[4.5rem] items-center justify-center px-2 text-center text-xs font-medium">
            {emptyLabel}
          </div>
        )}
      </div>
      {caption ? <p className="text-muted-foreground max-w-xl text-[11px] leading-snug">{caption}</p> : null}
    </div>
  );
}
