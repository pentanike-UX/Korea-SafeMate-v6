/**
 * T10 — Route View (Timeline)
 * IA §4.3 T10 · 릴리즈 [M][P]
 * v6 시그니처 화면 — HaruTimeline 가로 타임라인
 *
 * TODO(prod): routeId로 Supabase에서 실 데이터 fetch
 * TODO(prod): Traveler 인증 가드 (구매한 루트만 전체 접근, 샘플은 미리보기)
 */
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { HaruTimeline } from "@/components/patterns/haru-timeline";
import { mockHaruRoute } from "@/data/mock/haru-route";
import type { AppLocale } from "@/types/haru";
import { loginPathForLocale, withLocalePath } from "@/lib/auth/route-path";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";

interface Props {
  params: Promise<{ routeId: string; locale: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
}

export default async function RouteViewPage({ params, searchParams }: Props) {
  const { routeId, locale: localeParam } = await params;
  const locale = (await getLocale()) as AppLocale;
  const sp = await searchParams;
  const previewParam = typeof sp.preview === "string" ? sp.preview : Array.isArray(sp.preview) ? sp.preview[0] : null;
  const isPreview = previewParam === "1";

  if (!isPreview) {
    const userId = await getSupabaseAuthUserIdOnly();
    if (!userId) {
      const loginPath = loginPathForLocale(localeParam as AppLocale);
      const nextPath = safeNextPath(withLocalePath(localeParam as AppLocale, `/routes/${routeId}`)) ?? "/explore";
      redirect(`${loginPath}?next=${encodeURIComponent(nextPath)}`);
    }
  }

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
        <div className="relative">
          <HaruTimeline route={route} locale={locale} />
          {isPreview ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-lg)] bg-black/45">
              <div className="rounded-[var(--radius-md)] bg-background/95 px-4 py-3 text-center shadow-[var(--shadow-md)]">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Preview mode</p>
                <p className="mt-1 text-sm text-ink">구매 후 전체 루트를 확인할 수 있어요.</p>
              </div>
            </div>
          ) : null}
        </div>
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
              disabled={isPreview}
              className="rounded-[var(--radius-sm)] border border-line bg-bg-card px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              수정 요청
            </button>
            {/* TODO(prod): 오프라인 저장 */}
            <button
              type="button"
              disabled={isPreview}
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
