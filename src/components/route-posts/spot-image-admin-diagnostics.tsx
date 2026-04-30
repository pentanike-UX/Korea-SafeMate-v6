"use client";

import { useState } from "react";
import type { RouteSpot } from "@/types/domain";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * 슈퍼관리자 전용 — 자동 갤러리 요약(접힘). 일반 사용자에게는 부모에서 렌더하지 않음.
 */
export function SpotImageAdminDiagnostics({
  imageQuery,
  naverCount,
  slideCount,
  usedFallbackOnly,
  spot,
  className,
}: {
  imageQuery: string;
  naverCount: number;
  slideCount: number;
  usedFallbackOnly: boolean;
  spot: RouteSpot;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("mt-3 rounded-lg border border-emerald-500/15 bg-emerald-50/20 dark:bg-emerald-950/10", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[10px] font-semibold text-emerald-800 dark:text-emerald-300"
      >
        <span>
          이미지 자동 적용됨 · 후보 {naverCount} · 슬라이드 {slideCount}
          {usedFallbackOnly ? " · 네이버 폴백" : ""}
        </span>
        {open ? <ChevronUp className="size-3.5 shrink-0" /> : <ChevronDown className="size-3.5 shrink-0" />}
      </button>
      {open ? (
        <div className="border-t border-emerald-500/10 px-3 py-2 text-[10px] text-muted-foreground space-y-1">
          <p>
            <span className="font-medium text-foreground/80">검수 상태:</span> {spot.source_status ?? "—"}
          </p>
          <p>
            <span className="font-medium text-foreground/80">검색 쿼리:</span> {imageQuery || "—"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
