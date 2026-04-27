/**
 * T10 — Route View (Timeline)
 * IA §4.3 T10 · 릴리즈 [M][P]
 * v6 시그니처 화면 — HaruTimeline 가로 타임라인
 *
 * - `mock` / mock id: 개발용 고정 데이터
 * - UUID: Supabase `routes` + `route_spots` (RLS: 샘플 공개 / 커스텀은 예약자만)
 * - 샘플 루트: 전체 타임라인은 미리보기 오버레이(또는 `?preview=1`)
 * - 커스텀 루트: 로그인 + 수령 권한 시 오버레이 없음
 */
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { HaruTimeline } from "@/components/patterns/haru-timeline";
import { mockHaruRoute } from "@/data/mock/haru-route";
import type { AppLocale, HaruRoute } from "@/types/haru";
import { loginPathForLocale, withLocalePath } from "@/lib/auth/route-path";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import {
  fetchHaruRouteFromSupabase,
  isUuidRouteId,
} from "@/lib/routes/haru-route-from-supabase.server";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";

interface Props {
  params: Promise<{ routeId: string; locale: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
}

function isMockRouteId(routeId: string) {
  return routeId === mockHaruRoute.id || routeId === "mock";
}

export default async function RouteViewPage({ params, searchParams }: Props) {
  const { routeId, locale: localeParam } = await params;
  const locale = (await getLocale()) as AppLocale;
  const sp = await searchParams;
  const previewParam = typeof sp.preview === "string" ? sp.preview : Array.isArray(sp.preview) ? sp.preview[0] : null;
  const wantsPreview = previewParam === "1";

  const userId = await getSupabaseAuthUserIdOnly();

  let route: HaruRoute | null = null;
  let routeType: "sample" | "custom" | "mock" = "mock";
  let fromDb = false;

  if (isMockRouteId(routeId)) {
    if (!wantsPreview && !userId) {
      const loginPath = loginPathForLocale(localeParam as AppLocale);
      const nextPath = safeNextPath(withLocalePath(localeParam as AppLocale, `/routes/${routeId}`)) ?? "/explore";
      redirect(`${loginPath}?next=${encodeURIComponent(nextPath)}`);
    }
    route = mockHaruRoute;
    routeType = "mock";
  } else if (isUuidRouteId(routeId)) {
    const sb = await getServerSupabaseForUser();
    if (!sb) notFound();
    const bundle = await fetchHaruRouteFromSupabase(sb, routeId);
    if (!bundle) notFound();
    route = bundle.haru;
    routeType = bundle.routeType;
    fromDb = true;
    if (bundle.routeType === "custom" && !wantsPreview && !userId) {
      const loginPath = loginPathForLocale(localeParam as AppLocale);
      const nextPath =
        safeNextPath(withLocalePath(localeParam as AppLocale, `/routes/${routeId}`)) ?? "/explore";
      redirect(`${loginPath}?next=${encodeURIComponent(nextPath)}`);
    }
  } else {
    notFound();
  }

  if (!route) notFound();

  const t = await getTranslations("TravelerHub");
  const showPreviewOverlay = wantsPreview || routeType === "sample";

  const title = route.title[locale] ?? route.title.en ?? "Route";

  return (
    <main className="min-h-screen bg-bg">
      <div className="border-b border-line-soft bg-bg-card px-4 py-4 sm:px-6">
        <p className="text-xs font-medium text-ink-soft uppercase tracking-widest mb-1">
          {fromDb && routeType === "custom" ? t("routeViewKickerMyRoute") : t("routeViewKickerRoute")}
        </p>
        <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
      </div>

      <div className="px-4 py-6 sm:px-6 md:px-8">
        <div className="relative">
          <HaruTimeline route={route} locale={locale} />
          {showPreviewOverlay ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-lg)] bg-black/45">
              <div className="rounded-[var(--radius-md)] bg-background/95 px-4 py-3 text-center shadow-[var(--shadow-md)]">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{t("routeViewPreviewBadge")}</p>
                <p className="mt-1 text-sm text-ink">
                  {routeType === "sample" ? t("routeViewPreviewSampleLead") : t("routeViewPreviewPurchaseLead")}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-line bg-bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <p className="text-xs text-ink-muted">
            {route.spots.length}개 스팟 · 총 {Math.floor(route.total_duration_min / 60)}시간{" "}
            {route.total_duration_min % 60 > 0 ? `${route.total_duration_min % 60}분` : ""}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={showPreviewOverlay}
              className="rounded-[var(--radius-sm)] border border-line bg-bg-card px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              수정 요청
            </button>
            <button
              type="button"
              disabled={showPreviewOverlay}
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
  const { routeId, locale: localeParam } = await params;
  const locale = (["ko", "en", "th", "vi"] as const).includes(localeParam as AppLocale)
    ? (localeParam as AppLocale)
    : "en";

  if (isMockRouteId(routeId)) {
    const title = mockHaruRoute.title[locale] ?? mockHaruRoute.title.en ?? "Route";
    return { title, description: `${title} — Korea SafeMate` };
  }

  if (!isUuidRouteId(routeId)) {
    return { title: "Route", description: "Korea SafeMate" };
  }

  const sb = await getServerSupabaseForUser();
  if (!sb) return { title: "Route", description: "Korea SafeMate" };
  const bundle = await fetchHaruRouteFromSupabase(sb, routeId);
  const title = bundle?.haru.title[locale] ?? bundle?.haru.title.en ?? "Route";
  return {
    title,
    description: `${title} — Korea SafeMate`,
  };
}
