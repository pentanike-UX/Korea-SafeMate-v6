"use client";

import { useCallback, useState } from "react";
import type { RouteSpot } from "@/types/domain";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

const STATUS_KO: Record<NonNullable<RouteSpot["source_status"]>, string> = {
  verified: "실제 장소 확인됨(시드)",
  needs_review: "검토 필요(이미지·명칭)",
  mock: "목업(기본)",
};

/**
 * 슈퍼관리자 전용 — 스팟 검증 상태·이전 구간 이동 메모·지도 링크
 */
function NaverLocalPreview({ query }: { query: string }) {
  const [items, setItems] = useState<{ title: string; address?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/naver/local-search?query=${encodeURIComponent(query)}&display=5`,
      );
      const json = (await res.json()) as {
        items?: { title: string; address?: string }[];
        unavailable?: boolean;
      };
      if (json.unavailable) {
        setErr("NAVER 검색 키 미설정");
        setItems([]);
        return;
      }
      setItems(json.items ?? []);
    } catch {
      setErr("요청 실패");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="border-border/40 mt-2 border-t border-dashed pt-2">
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="text-primary mb-1 font-semibold hover:underline disabled:opacity-50"
      >
        {loading ? "검색 중…" : "네이버 로컬 장소 후보 보기"}
      </button>
      {err ? <p className="text-destructive">{err}</p> : null}
      {items.length > 0 ? (
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-[9px]">
          {items.slice(0, 5).map((it, i) => (
            <li key={`${it.title}-${i}`}>
              {it.title}
              {it.address ? <span className="text-muted-foreground"> — {it.address}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SpotVerificationStrip({ spot, className }: { spot: RouteSpot; className?: string }) {
  const st = spot.source_status ?? "mock";
  const localQuery = spot.real_place_name || spot.place_name || spot.title;
  return (
    <div
      className={cn(
        "text-muted-foreground space-y-1.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-[10px] leading-snug",
        className,
      )}
    >
      <p>
        <span className="font-semibold text-foreground/80">검수</span> · {STATUS_KO[st]}
        {spot.image_candidates && spot.image_candidates.length > 0 ? " · 이미지 후보 캐시 있음" : ""}
        {spot.images?.hero ? " · hero URL 지정" : ""}
      </p>
      {spot.leg_from_previous ? (
        <p>
          <span className="font-semibold text-foreground/80">이전 구간</span> · {spot.leg_from_previous}
        </p>
      ) : null}
      {spot.naver_link ? (
        <a
          href={spot.naver_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          네이버 지도에서 장소 열기
          <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : null}
      <NaverLocalPreview query={localQuery} />
    </div>
  );
}
