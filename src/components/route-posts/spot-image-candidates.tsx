"use client";

/**
 * SpotImageCandidates — 슈퍼관리자 전용 이미지 후보 피커
 *
 * 슈퍼관리자 로그인 시에만 표시.
 * - "이미지 후보 새로고침" → /api/naver/image-search 호출
 * - 3~6개 썸네일 후보 표시
 * - "대표로 선택" → localStorage에 저장 (추후 Supabase 확장 포인트)
 *
 * 확장 포인트:
 *   localStorage key: `haruway:spot:${spotId}:selectedImage`
 *   추후 PATCH /api/admin/spots/[spotId] 또는 content_posts JSON 업데이트로 교체.
 */
import { useCallback, useEffect, useState } from "react";
import type { NaverImageCandidate } from "@/types/domain";
import { clearLocalSelectedImage, readLocalSelectedImage, writeLocalSelectedImage } from "@/lib/spot-image-local-selection";
import { cn } from "@/lib/utils";

/** @deprecated import from `@/lib/spot-image-local-selection` */
export { readLocalSelectedImage } from "@/lib/spot-image-local-selection";

interface SpotImageCandidatesProps {
  spotId: string;
  imageQuery: string;
  /** 현재 서버 데이터의 selected_image (JSON에 저장된 값) */
  serverSelectedImage?: string | null;
  /** localStorage 선택 후 부모가 이미지 URL을 다시 읽을 때 */
  onPicked?: () => void;
  className?: string;
}

export function SpotImageCandidates({
  spotId,
  imageQuery,
  serverSelectedImage,
  onPicked,
  className,
}: SpotImageCandidatesProps) {
  const [candidates, setCandidates] = useState<NaverImageCandidate[]>([]);
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // localStorage에서 선택 이미지 읽기
  useEffect(() => {
    setLocalSelected(readLocalSelectedImage(spotId));
  }, [spotId]);

  const fetchCandidates = useCallback(async () => {
    if (!imageQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/naver/image-search?query=${encodeURIComponent(imageQuery)}&display=6`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { items: NaverImageCandidate[]; unavailable?: boolean };
      if (json.unavailable) {
        setError("Naver API 미설정 (NAVER_SEARCH_CLIENT_ID / SECRET)");
      } else {
        setCandidates(json.items ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색 실패");
    } finally {
      setLoading(false);
    }
  }, [imageQuery]);

  function selectImage(url: string) {
    writeLocalSelectedImage(spotId, url);
    setLocalSelected(url);
    onPicked?.();
  }

  function clearSelection() {
    clearLocalSelectedImage(spotId);
    setLocalSelected(null);
    onPicked?.();
  }

  const currentSelected = localSelected ?? serverSelectedImage ?? null;

  return (
    <div
      className={cn(
        "mt-4 rounded-xl border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/15 p-3",
        className,
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-[0.15em] text-emerald-700 uppercase dark:text-emerald-400">
            🛡 이미지 후보
          </span>
          {imageQuery && (
            <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60">
              "{imageQuery}"
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setExpanded((v) => !v);
            if (!expanded && candidates.length === 0) {
              void fetchCandidates();
            }
          }}
          className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 transition-colors"
        >
          {expanded ? "접기 ▲" : "펼치기 ▼"}
        </button>
      </div>

      {/* 현재 선택 이미지 표시 */}
      {currentSelected ? (
        <div className="mt-2 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSelected}
            alt="현재 선택 이미지"
            className="size-10 rounded-lg object-cover border border-emerald-400/30"
            loading="lazy"
          />
          <div>
            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              현재 선택됨{localSelected ? " (로컬)" : " (서버)"}
            </p>
            {localSelected && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-[10px] text-rose-500 hover:text-rose-700 transition-colors"
              >
                선택 해제
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* 후보 목록 */}
      {expanded && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70">
              {candidates.length > 0 ? `후보 ${candidates.length}개` : "후보 없음"}
            </p>
            <button
              type="button"
              onClick={fetchCandidates}
              disabled={loading}
              className="rounded-md border border-emerald-400/30 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors dark:bg-emerald-950/30 dark:text-emerald-400"
            >
              {loading ? "검색 중..." : "후보 새로고침"}
            </button>
          </div>

          {error ? (
            <p className="text-[10px] text-rose-500">{error}</p>
          ) : candidates.length === 0 && !loading ? (
            <p className="text-[10px] text-muted-foreground">
              "후보 새로고침" 버튼을 눌러 Naver 이미지 검색 결과를 불러오세요.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {candidates.map((candidate, i) => {
                const isSelected =
                  currentSelected === candidate.thumbnail ||
                  currentSelected === candidate.link;
                return (
                  <div key={`${candidate.thumbnail}-${i}`} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={candidate.thumbnail}
                      alt={candidate.title || "이미지 후보"}
                      className={cn(
                        "w-full aspect-square rounded-lg object-cover border transition-all cursor-pointer",
                        isSelected
                          ? "border-emerald-500 ring-2 ring-emerald-400/50"
                          : "border-border/40 hover:border-emerald-400/60",
                      )}
                      loading="lazy"
                      onClick={() => selectImage(candidate.thumbnail)}
                      title={candidate.title}
                    />
                    {isSelected && (
                      <span className="absolute top-0.5 right-0.5 rounded-full bg-emerald-500 px-1 py-0.5 text-[8px] font-bold text-white">
                        ✓
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => selectImage(candidate.thumbnail)}
                      className="mt-0.5 w-full rounded bg-emerald-100/80 py-0.5 text-[9px] font-semibold text-emerald-800 hover:bg-emerald-200 transition-colors dark:bg-emerald-900/40 dark:text-emerald-300"
                    >
                      {isSelected ? "✓ 선택됨" : "선택"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 확장 포인트 안내 */}
          <p className="mt-2 text-[9px] text-muted-foreground/60">
            선택 이미지는 브라우저 localStorage에 임시 저장됩니다.
            실제 반영은 Supabase spot_images 또는 route_journey JSON 업데이트 필요.
          </p>
        </div>
      )}
    </div>
  );
}
