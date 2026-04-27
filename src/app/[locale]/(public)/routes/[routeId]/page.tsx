/**
 * T10 — Route View (Timeline)
 * IA §4.3 T10 · 릴리즈 [M][P]
 * v6 시그니처 화면 — HaruTimeline 가로 타임라인
 *
 * TODO(prod): routeId로 Supabase에서 실 데이터 fetch
 * TODO(prod): Traveler 인증 가드 (구매한 루트만 전체 접근, 샘플은 미리보기)
 */
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { HaruTimeline } from "@/components/patterns/haru-timeline";
import { mockHaruRoute } from "@/data/mock/haru-route";
import type { AppLocale } from "@/types/haru";

interface Props {
  params: Promise<{ routeId: string; locale: string }>;
}

export default async function RouteViewPage({ params }: Props) {
  const { routeId } = await params;
  const locale = (await getLocale()) as AppLocale;

  // TODO(prod): Supabase에서 routeId로 fetch. 지금은 mock 고정.
  const route = routeId === mockHaruRoute.id || routeId === "mock"
    ? mockHaruRoute
    : null;

  if (!route) notFound();

  const title = route.title[locale] ?? route.title.en ?? "Route";

  return (
    <main className="min-h-screen bg-bg">
      {/* 페이지 헤더 */}
      <div className="border-b border-line-soft bg-bg-card px-4 py-4 sm:px-6">
        <p className="text-xs font-medium text-ink-soft uppercase tracking-widest mb-1">
          My Route
        </p>
        <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
          {title}
        </h1>
      </div>

      {/* 타임라인 */}
      <div className="px-4 py-6 sm:px-6 md:px-8">
        <HaruTimeline
          route={route}
          locale={locale}
          onSpotClick={(spot) => {
            // TODO(prod): 스팟 상세 모달 또는 드로어 열기
            console.log("spot clicked:", spot.id);
          }}
        />
      </div>

      {/* 하단 액션 바 */}
      <div className="sticky bottom-0 border-t border-line bg-bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <p className="text-xs text-ink-muted">
            {route.spots.length}개 스팟 · 총{" "}
            {Math.floor(route.total_duration_min / 60)}시간{" "}
            {route.total_duration_min % 60 > 0 ? `${route.total_duration_min % 60}분` : ""}
          </p>
          <div className="flex gap-2">
            {/* TODO(prod): 수정 요청 → T11 Revision Request */}
            <button
              type="button"
              className="rounded-[var(--radius-sm)] border border-line bg-bg-card px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              수정 요청
            </button>
            {/* TODO(prod): 오프라인 저장 */}
            <button
              type="button"
              className="rounded-[var(--radius-sm)] bg-accent-ksm px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
            >
              저장하기
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: Props) {
  const { routeId } = await params;
  const route = routeId === mockHaruRoute.id || routeId === "mock"
    ? mockHaruRoute
    : null;
  const title = route?.title.en ?? "Route";
  return {
    title,
    description: `${title} — Korea SafeMate`,
  };
}
