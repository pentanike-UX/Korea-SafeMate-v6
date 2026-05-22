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
import { RouteViewClient } from "@/components/routes/route-view-client";
import { mockHaruRoute } from "@/data/mock/haru-route";
import type { AppLocale, HaruRoute } from "@/types/haru";
import { loginPathForLocale, withLocalePath } from "@/lib/auth/route-path";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import {
  fetchHaruRouteFromSupabase,
  isUuidRouteId,
  type StoredDirectionsMeta,
} from "@/lib/routes/haru-route-from-supabase.server";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { getDirectionsForCoords } from "@/lib/routing/directions-server";

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
  let routesDirectionsMeta: StoredDirectionsMeta | null = null;

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
    routesDirectionsMeta = bundle.directionsMeta;
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

  // 잠금/해제 결정:
  // - 본인 커스텀 루트(routeType=custom + DB 보유) → 즉시 unlocked
  // - 그 외(mock, sample, preview=1) → 처음 lock 상태로 무료 영역 노출, 결제 시 해제
  const initialUnlocked = fromDb && routeType === "custom" && !wantsPreview;

  const title = route.title[locale] ?? route.title.en ?? "Route";

  // directions 우선순위:
  //   1) routes.directions_meta (delivery 시점에 저장) — 외부 호출 0회.
  //   2) Vercel Runtime Cache 또는 라이브 컴퓨트 (24h 캐시 사용).
  // mock 라우트는 DB 메타가 없으므로 항상 라이브 컴퓨트.
  let directions: {
    path: Array<{ lat: number; lng: number }>;
    legs: Array<{ distance_m: number | null; duration_s: number | null }>;
    provider: "google" | "osrm";
  } | null = null;

  const storedMeta = fromDb ? routesDirectionsMeta : null;
  if (storedMeta) {
    directions = { path: storedMeta.path, legs: storedMeta.legs, provider: storedMeta.provider };
  } else {
    const directionsCoords = [...route.spots]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ lat: s.catalog.lat, lng: s.catalog.lng }));
    if (directionsCoords.length >= 2) {
      const r = await getDirectionsForCoords(directionsCoords, "foot");
      if (r) directions = { path: r.path, legs: r.legs, provider: r.provider };
    }
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="border-b border-line-soft bg-bg-card px-4 py-4 sm:px-6">
        <p className="text-xs font-medium text-ink-soft uppercase tracking-widest mb-1">
          {fromDb && routeType === "custom" ? t("routeViewKickerMyRoute") : t("routeViewKickerRoute")}
        </p>
        <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
      </div>

      <RouteViewClient
        route={route}
        locale={locale}
        initialUnlocked={initialUnlocked}
        precomputedDirections={
          directions ? { path: directions.path, legs: directions.legs, provider: directions.provider } : null
        }
      />
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
    return { title, description: `${title} — 하루` };
  }

  if (!isUuidRouteId(routeId)) {
    return { title: "Route", description: "하루" };
  }

  const sb = await getServerSupabaseForUser();
  if (!sb) return { title: "Route", description: "하루" };
  const bundle = await fetchHaruRouteFromSupabase(sb, routeId);
  const title = bundle?.haru.title[locale] ?? bundle?.haru.title.en ?? "Route";
  return {
    title,
    description: `${title} — 하루`,
  };
}
