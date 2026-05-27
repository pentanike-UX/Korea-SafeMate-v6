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
import { routing } from "@/i18n/routing";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import {
  fetchHaruRouteFromSupabase,
  isUuidRouteId,
  type StoredDirectionsMeta,
} from "@/lib/routes/haru-route-from-supabase.server";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { getDirectionsForCoords } from "@/lib/routing/directions-server";
import mockDirections from "@/data/mock/haru-route-directions.json";
import { resolveRouteAccessServer } from "@/lib/route-access.server";
import { isUuidRouteId as _isUuid } from "@/lib/routes/haru-route-from-supabase.server";
import { logRouteViewEvent } from "@/lib/route-view-log.server";
import { redeemRouteInviteLinkAction } from "@/lib/route-access-actions.server";

interface Props {
  params: Promise<{ routeId: string; locale: string }>;
  searchParams: Promise<{ preview?: string | string[]; invite?: string | string[] }>;
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
  const inviteTokenParam =
    typeof sp.invite === "string" ? sp.invite : Array.isArray(sp.invite) ? sp.invite[0] : null;
  const inviteToken = inviteTokenParam?.trim() || null;
  const appLocale = (routing.locales.includes(localeParam as AppLocale)
    ? localeParam
    : locale) as AppLocale;

  const userId = await getSupabaseAuthUserIdOnly();

  /** 초대 링크 redeem 실패 시 결제 UI 대신 안내할 힌트. */
  let inviteAccessHint: "claimed" | "invalid" | null = null;

  // Phase 3N — 토큰 링크: 비로그인 → 초대 맥락 로그인, 로그인 후 redeem → 깨끗한 URL로 redirect.
  if (inviteToken && _isUuid(routeId)) {
    if (!userId) {
      const loginPath = loginPathForLocale(appLocale);
      const nextPath =
        safeNextPath(withLocalePath(appLocale, `/routes/${routeId}?invite=${encodeURIComponent(inviteToken)}`)) ??
        "/explore";
      redirect(`${loginPath}?next=${encodeURIComponent(nextPath)}`);
    }
    const redeem = await redeemRouteInviteLinkAction({ routeId, token: inviteToken });
    if (redeem.ok) {
      if (redeem.status === "redeemed" || redeem.status === "already-redeemed") {
        redirect(withLocalePath(appLocale, `/routes/${routeId}`));
      }
    } else if (redeem.error === "invite-claimed") {
      inviteAccessHint = "claimed";
    } else if (
      redeem.error === "invite-not-found" ||
      redeem.error === "invite-inactive" ||
      redeem.error === "grant-expired" ||
      redeem.error === "route-mismatch"
    ) {
      inviteAccessHint = "invalid";
    }
  }

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

  // 잠금/해제 결정 (정책: docs/payment-and-share-policy.md):
  // - 본인 커스텀 루트 → 즉시 unlocked
  // - DB grant 보유(본인 결제) 또는 활성 공유 초대 → unlocked + sharedBy 정보
  // - 그 외 → lock + 결제 시 해제
  let accessSharedBy: {
    user_id: string;
    display_name: string;
    avatar_url?: string | null;
  } | null = null;
  let accessOwnerGrantId: string | null = null;
  /** ticket-prompt / tickets-exhausted 등 잠금이긴 하지만 클라이언트에서 분기 다이얼로그가 필요한 경우. */
  let accessLockedHint: {
    reason: "ticket-prompt" | "tickets-exhausted";
    ticketsRemaining?: number | null;
    ticketPackId?: string | null;
  } | null = null;
  let viewLogSource: "owner" | "shared-invite" | "ticket" | "custom-self" | null = null;
  let initialUnlocked = fromDb && routeType === "custom" && !wantsPreview;
  if (initialUnlocked) {
    viewLogSource = "custom-self";
  }
  if (!initialUnlocked && _isUuid(routeId)) {
    // 비-mock UUID 루트는 preview 쿼리와 무관하게 access resolver 적용.
    // 정책: 결제(owner)·공유 초대(shared-invite) 보유자는 어떤 진입경로로 와도 즉시 unlock.
    //       `?preview=1`은 미결제 사용자의 "맛보기" 진입(미로그인/비결제) 의도로만 사용.
    const decision = await resolveRouteAccessServer({ routeId, userId });
    if (decision.canView) {
      initialUnlocked = true;
      if (decision.reason === "shared-invite" && decision.sharedBy) {
        accessSharedBy = decision.sharedBy;
        viewLogSource = "shared-invite";
      }
      if (decision.reason === "owner" && decision.ownerGrantId) {
        accessOwnerGrantId = decision.ownerGrantId;
        viewLogSource = "owner";
      }
    } else if (!wantsPreview && decision.reason === "ticket-prompt") {
      accessLockedHint = {
        reason: "ticket-prompt",
        ticketsRemaining: decision.ticketsRemaining ?? null,
        ticketPackId: decision.ticketPackId ?? null,
      };
    } else if (!wantsPreview && decision.reason === "tickets-exhausted") {
      accessLockedHint = { reason: "tickets-exhausted" };
    }
  }
  // 투명성 — 실제 unlocked 상태로 진입한 UUID 루트는 본인 열람 이력으로 로깅.
  if (initialUnlocked && userId && _isUuid(routeId) && viewLogSource) {
    await logRouteViewEvent({
      routeId,
      viewerUserId: userId,
      source: viewLogSource,
      grantId: accessOwnerGrantId,
    });
  }

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
  } else if (!fromDb) {
    // mock 라우트 — 빌드 타임에 캐싱된 정적 JSON 우선 사용 (외부 호출 0회).
    const cached = (mockDirections as Record<string, { provider?: string; path?: Array<{ lat: number; lng: number }>; legs?: Array<{ distance_m: number | null; duration_s: number | null }> }>)[route.id];
    if (
      cached?.path && cached.path.length >= 2 &&
      (cached.provider === "google" || cached.provider === "osrm")
    ) {
      directions = {
        path: cached.path,
        legs: Array.isArray(cached.legs) ? cached.legs : [],
        provider: cached.provider,
      };
    }
  }

  if (!directions) {
    const directionsCoords = [...route.spots]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ lat: s.catalog.lat, lng: s.catalog.lng }));
    if (directionsCoords.length >= 2) {
      const r = await getDirectionsForCoords(directionsCoords, "foot");
      if (r) directions = { path: r.path, legs: r.legs, provider: r.provider };
    }
  }

  // 저장(북마크) 상태 — UUID(DB) 루트 + 로그인 사용자일 때만.
  const canSave = fromDb && isUuidRouteId(routeId);
  let initialSaved = false;
  if (canSave && userId) {
    const sb = await getServerSupabaseForUser();
    if (sb) {
      const { data: savedRow } = await sb
        .from("traveler_saved_routes")
        .select("route_id")
        .eq("traveler_user_id", userId)
        .eq("route_id", routeId)
        .maybeSingle();
      initialSaved = Boolean(savedRow);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-bg">
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
        canSave={canSave && Boolean(userId)}
        initialSaved={initialSaved}
        sharedBy={accessSharedBy}
        lockedHint={accessLockedHint}
        ownerGrantId={accessOwnerGrantId}
        inviteAccessHint={inviteAccessHint}
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
