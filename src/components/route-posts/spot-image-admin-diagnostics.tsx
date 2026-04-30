"use client";

import { useState } from "react";
import type { NaverPrimaryPlace, RouteSpot } from "@/types/domain";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * 슈퍼관리자 전용 — Local Entity + 이미지 파이프라인 요약(접힘). 선택 UI 없음.
 */
export function SpotImageAdminDiagnostics({
  imageQuery,
  naverCount,
  slideCount,
  usedFallbackOnly,
  usedBroadFallback,
  spot,
  primaryPlace,
  placeSimilarityScore,
  searchQueryUsedForResolve,
  imageQueriesTried,
  excludedApprox,
  className,
}: {
  imageQuery: string;
  naverCount: number;
  slideCount: number;
  usedFallbackOnly: boolean;
  usedBroadFallback: boolean;
  spot: RouteSpot;
  primaryPlace: NaverPrimaryPlace | null;
  placeSimilarityScore: number | null;
  searchQueryUsedForResolve: string;
  imageQueriesTried: string[];
  excludedApprox: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const headerLine = [
    primaryPlace ? "Local Entity 확정" : "Local 미매칭",
    `갤러리 ${slideCount}장`,
    `원본 후보 ${naverCount}개`,
    usedBroadFallback ? "넓은 쿼리 폴백" : "Entity 기반 쿼리",
    usedFallbackOnly ? "로컬 폴백" : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={cn("mt-3 rounded-lg border border-emerald-500/15 bg-emerald-50/20 dark:bg-emerald-950/10", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[10px] font-semibold text-emerald-800 dark:text-emerald-300"
      >
        <span className="line-clamp-2">{headerLine}</span>
        {open ? <ChevronUp className="size-3.5 shrink-0" /> : <ChevronDown className="size-3.5 shrink-0" />}
      </button>
      {open ? (
        <div className="border-t border-emerald-500/10 px-3 py-2 text-[10px] text-muted-foreground space-y-1.5">
          <p>
            <span className="font-medium text-foreground/80">검수 상태:</span> {spot.source_status ?? "—"}
          </p>
          <p>
            <span className="font-medium text-foreground/80">Local 검색 쿼리:</span> {searchQueryUsedForResolve || "—"}
          </p>
          <p>
            <span className="font-medium text-foreground/80">대표 이미지 검색어(1순위 라벨):</span> {imageQuery || "—"}
          </p>
          {primaryPlace ? (
            <>
              <p>
                <span className="font-medium text-foreground/80">primaryPlace.title:</span> {primaryPlace.title}
              </p>
              <p>
                <span className="font-medium text-foreground/80">primaryPlace 주소:</span>{" "}
                {primaryPlace.roadAddress || primaryPlace.address || "—"}
              </p>
              <p>
                <span className="font-medium text-foreground/80">장소 유사도:</span>{" "}
                {placeSimilarityScore != null ? placeSimilarityScore : primaryPlace.similarityScore}
              </p>
            </>
          ) : null}
          <p>
            <span className="font-medium text-foreground/80">이미지 쿼리 시도:</span>{" "}
            {imageQueriesTried.length ? imageQueriesTried.slice(0, 5).join(" → ") : "—"}
            {imageQueriesTried.length > 5 ? " …" : ""}
          </p>
          <p>
            <span className="font-medium text-foreground/80">중복 제외(대략):</span> {excludedApprox}건
          </p>
        </div>
      ) : null}
    </div>
  );
}
