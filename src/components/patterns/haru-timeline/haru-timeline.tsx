"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { HaruRoute, HaruSpot, AppLocale } from "@/types/haru";
import { SpotCard } from "./spot-card";
import { LegConnector } from "./leg-connector";

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function localeText(
  map: Partial<Record<AppLocale, string | null>> | undefined,
  locale: AppLocale,
  fallback = "",
): string {
  if (!map) return fallback;
  const order: AppLocale[] = [locale, "en", "ko", "th", "vi"];
  for (const l of order) {
    const v = map[l];
    if (v) return v;
  }
  return fallback;
}

function formatKrw(min: number, max?: number | null): string {
  const fmt = (n: number) =>
    n >= 10000 ? `${Math.round(n / 10000)}만원` : `${n.toLocaleString()}원`;
  return max ? `${fmt(min)} ~ ${fmt(max)}` : fmt(min);
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

// ── Map Placeholder ───────────────────────────────────────────────────────────

function MapPanel({ route }: { route: HaruRoute }) {
  return (
    <div className="relative mt-4 overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-sunken">
      {/* TODO(prod): Naver Maps / Kakao Maps SDK 연동 */}
      <div className="flex h-56 items-center justify-center sm:h-72">
        <div className="text-center">
          <p className="text-2xl" aria-hidden>🗺️</p>
          <p className="mt-2 text-sm font-medium text-ink-muted">지도 연동 준비 중</p>
          <p className="text-xs text-ink-soft mt-1">
            {route.spots.length}개 스팟 · Naver Maps 연동 예정
          </p>
        </div>
      </div>

      {/* 스팟 좌표 목록 (개발 참고용) */}
      <div className="border-t border-line-soft px-4 py-3">
        <ul className="flex flex-wrap gap-2">
          {route.spots.map((spot) => (
            <li key={spot.id} className="flex items-center gap-1 text-[10px] text-ink-soft">
              <span aria-hidden>{spot.catalog.category_emoji}</span>
              <span className="tabular-nums">
                {spot.catalog.lat.toFixed(4)}, {spot.catalog.lng.toFixed(4)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Scroll Hint ───────────────────────────────────────────────────────────────

function ScrollHint() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-bg to-transparent sm:hidden"
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export interface HaruTimelineProps {
  route: HaruRoute;
  locale?: AppLocale;
  /** 스팟 클릭 시 콜백 (상세 모달 등) */
  onSpotClick?: (spot: HaruSpot) => void;
  className?: string;
}

export function HaruTimeline({
  route,
  locale = "en",
  onSpotClick,
  className,
}: HaruTimelineProps) {
  const [compact, setCompact] = React.useState(false);
  const [mapOpen, setMapOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const title = localeText(route.title, locale);

  return (
    <section
      className={cn("relative flex flex-col gap-4", className)}
      aria-label={title}
    >
      {/* ── 헤더 ── */}
      <TimelineHeader
        route={route}
        locale={locale}
        compact={compact}
        mapOpen={mapOpen}
        onToggleCompact={() => setCompact((v) => !v)}
        onToggleMap={() => setMapOpen((v) => !v)}
      />

      {/* ── 타임라인 스크롤 영역 ── */}
      <div className="relative">
        <ScrollHint />
        <div
          ref={scrollRef}
          className={cn(
            "flex items-center gap-0 overflow-x-auto pb-4",
            // 스냅 스크롤 (모바일)
            "snap-x snap-mandatory sm:snap-none",
            // 스크롤바 숨기기 (시각적으로 깔끔하게)
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            // 상하 패딩 — 카드 그림자 잘리지 않게
            "px-1 pt-1",
          )}
          role="list"
          aria-label="하루 루트 스팟 목록"
        >
          {route.spots.map((spot, idx) => (
            <React.Fragment key={spot.id}>
              {/* 이동 커넥터 — 첫 스팟 앞에는 없음 */}
              {idx > 0 && spot.move_from_prev_method && spot.move_from_prev_min && (
                <LegConnector
                  method={spot.move_from_prev_method}
                  durationMin={spot.move_from_prev_min}
                />
              )}

              {/* 스팟 카드 */}
              <div
                role="listitem"
                className="snap-start"
              >
                <SpotCard
                  spot={spot}
                  locale={locale}
                  compact={compact}
                  onClick={onSpotClick}
                />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── 지도 패널 ── */}
      {mapOpen && <MapPanel route={route} />}
    </section>
  );
}

// ── Timeline Header ───────────────────────────────────────────────────────────

interface TimelineHeaderProps {
  route: HaruRoute;
  locale: AppLocale;
  compact: boolean;
  mapOpen: boolean;
  onToggleCompact: () => void;
  onToggleMap: () => void;
}

function TimelineHeader({
  route,
  locale,
  compact,
  mapOpen,
  onToggleCompact,
  onToggleMap,
}: TimelineHeaderProps) {
  const title = localeText(route.title, locale);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {/* 왼쪽: 타이틀 + 메타 */}
      <div className="flex flex-col gap-1.5">
        <h2 className="font-serif text-lg font-semibold text-ink leading-snug sm:text-xl">
          {title}
        </h2>

        {/* 메타 칩 행 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 가디언 */}
          <MetaChip icon="👤" label={route.guardian.display_name} />

          {/* 총 시간 */}
          <MetaChip icon="⏱" label={formatDuration(route.total_duration_min)} />

          {/* 예상 비용 */}
          {route.estimated_cost_min_krw != null && (
            <MetaChip
              icon="💰"
              label={formatKrw(route.estimated_cost_min_krw, route.estimated_cost_max_krw)}
            />
          )}

          {/* 스팟 수 */}
          <MetaChip icon="📍" label={`${route.spots.length}개 스팟`} />
        </div>
      </div>

      {/* 오른쪽: 뷰 토글 버튼들 */}
      <div className="flex items-center gap-2 self-start sm:self-auto">
        {/* 조감/세부 전환 — 데스크톱에서만 */}
        <button
          type="button"
          onClick={onToggleCompact}
          aria-pressed={compact}
          aria-label={compact ? "세부 모드로 전환" : "조감 모드로 전환"}
          className={cn(
            "hidden sm:flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 py-1.5",
            "text-xs font-medium transition-colors duration-150",
            compact
              ? "border-ink/20 bg-ink text-bg"
              : "border-line bg-bg-card text-ink-muted hover:border-ink/20 hover:text-ink",
          )}
        >
          {compact ? "🔍 세부" : "🗺 조감"}
        </button>

        {/* 지도 토글 */}
        <button
          type="button"
          onClick={onToggleMap}
          aria-pressed={mapOpen}
          aria-label={mapOpen ? "지도 닫기" : "지도 보기"}
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 py-1.5",
            "text-xs font-medium transition-colors duration-150",
            mapOpen
              ? "border-accent-ksm/30 bg-accent-soft text-accent-dark"
              : "border-line bg-bg-card text-ink-muted hover:border-accent-ksm/30 hover:text-accent-dark",
          )}
        >
          🗺️ {mapOpen ? "지도 닫기" : "지도 보기"}
        </button>
      </div>
    </div>
  );
}

function MetaChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-bg-sunken px-2.5 py-1 text-xs text-ink-muted">
      <span aria-hidden>{icon}</span>
      {label}
    </span>
  );
}
