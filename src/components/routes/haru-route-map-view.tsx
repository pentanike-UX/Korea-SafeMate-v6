"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Map,
  AdvancedMarker,
  Pin,
  useApiIsLoaded,
  useMap,
} from "@vis.gl/react-google-maps";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoogleMapsState } from "@/components/maps/google-maps-provider";
import type { HaruRoute, HaruSpot, AppLocale } from "@/types/haru";

type LatLng = { lat: number; lng: number };

/**
 * 하루루트 지도 뷰 — 전체 스팟을 핀으로 표시 + 순서대로 연결 폴리라인.
 * 핀 탭 시 onSpotClick 콜백으로 시트 오픈.
 *
 * env `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` 미설정 시 안내 카드 표시.
 */
export function HaruRouteMapView({
  route,
  locale,
  onSpotClick,
  className,
  precomputedPath = null,
  precomputedProvider = null,
}: {
  route: HaruRoute;
  locale: AppLocale;
  onSpotClick?: (spot: HaruSpot) => void;
  className?: string;
  /** 서버에서 미리 계산해둔 폴리라인 — 있으면 자체 fetch 생략. */
  precomputedPath?: LatLng[] | null;
  precomputedProvider?: "google" | "osrm" | null;
}) {
  const keyConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY);
  const mapsState = useGoogleMapsState();

  if (!keyConfigured) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-50/60 p-6 dark:bg-amber-950/20", className)}>
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-2 size-6 text-amber-600" aria-hidden />
          <p className="mb-1 text-sm font-bold text-foreground">지도를 표시하려면 키 설정이 필요해요</p>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Vercel 환경변수 <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY</code>를 추가하고 Maps JavaScript API를 활성화하세요.
          </p>
        </div>
      </div>
    );
  }

  if (mapsState.authFailed) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/5 p-6", className)}>
        <div className="max-w-md text-left">
          <AlertCircle className="mx-auto mb-2 size-6 text-destructive" aria-hidden />
          <p className="mb-1 text-center text-sm font-bold text-foreground">Google Maps 인증 실패</p>
          <p className="mb-3 text-center text-[12px] leading-relaxed text-muted-foreground">
            키는 설정되어 있지만 Google이 호출을 거부했습니다.
          </p>
          <ul className="space-y-1 text-[12px] leading-relaxed text-muted-foreground">
            <li>• GCP에서 <strong>Maps JavaScript API</strong> 활성화 확인</li>
            <li>• 키의 <strong>HTTP referrer 제한</strong>에 <code className="rounded bg-muted px-1">{`*.vercel.app/*`}</code>·운영 도메인 추가</li>
            <li>• 빌링·예산 한도 확인</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <HaruRouteMapInner
      route={route}
      locale={locale}
      onSpotClick={onSpotClick}
      className={className}
      precomputedPath={precomputedPath}
      precomputedProvider={precomputedProvider}
    />
  );
}

type PolylineStatus = "loading" | "routed" | "straight";

function HaruRouteMapInner({
  route,
  locale,
  onSpotClick,
  className,
  precomputedPath,
  precomputedProvider,
}: {
  route: HaruRoute;
  locale: AppLocale;
  onSpotClick?: (spot: HaruSpot) => void;
  className?: string;
  precomputedPath: LatLng[] | null;
  precomputedProvider: "google" | "osrm" | null;
}) {
  const hasPrecomputed = precomputedPath != null && precomputedPath.length >= 2;
  const [polylineStatus, setPolylineStatus] = useState<PolylineStatus>(
    hasPrecomputed ? "routed" : "loading",
  );
  const isLoaded = useApiIsLoaded();
  const spots = useMemo(() => [...route.spots].sort((a, b) => a.order - b.order), [route.spots]);
  const center = useMemo(() => {
    if (spots.length === 0) return { lat: 37.5665, lng: 126.978 };
    const lat = spots.reduce((s, x) => s + x.catalog.lat, 0) / spots.length;
    const lng = spots.reduce((s, x) => s + x.catalog.lng, 0) / spots.length;
    return { lat, lng };
  }, [spots]);

  if (!isLoaded) {
    return (
      <div className={cn("flex h-[60vh] items-center justify-center gap-2 rounded-2xl bg-muted text-muted-foreground", className)}>
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">지도 로드 중…</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border/40", className)}>
      <Map
        mapId="haru-route-view"
        defaultCenter={center}
        defaultZoom={14}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        {spots.map((s) => (
          <AdvancedMarker
            key={s.id}
            position={{ lat: s.catalog.lat, lng: s.catalog.lng }}
            onClick={() => onSpotClick?.(s)}
            title={s.catalog.name[locale] ?? s.catalog.name.en ?? `Spot ${s.order}`}
          >
            <Pin
              background={spotPinColor(s)}
              borderColor="#ffffff"
              glyphColor="#ffffff"
              scale={s.featured ? 1.25 : 1.05}
            >
              <span className="text-xs font-bold">{s.order}</span>
            </Pin>
          </AdvancedMarker>
        ))}
        <RoutePolyline
          spots={spots}
          precomputedPath={precomputedPath}
          precomputedProvider={precomputedProvider}
          onStatusChange={setPolylineStatus}
        />
      </Map>

      {/* 우측 상단 안내 배지 — 직선 폴백 시 사용자에게 "근사 경로"임을 알림 */}
      {polylineStatus !== "routed" ? (
        <div
          className={cn(
            "pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur",
            polylineStatus === "loading"
              ? "border-border/40 bg-card/85 text-muted-foreground"
              : "border-amber-300/40 bg-amber-50/90 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
          )}
          role="status"
          aria-live="polite"
        >
          {polylineStatus === "loading" ? (
            <>
              <Loader2 className="size-3 animate-spin" aria-hidden />
              <span>도보 경로 계산 중…</span>
            </>
          ) : (
            <>
              <AlertCircle className="size-3" aria-hidden />
              <span>근사 경로 표시 중</span>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** 스팟 카테고리·역할에 따른 핀 컬러. */
function spotPinColor(spot: HaruSpot): string {
  if (spot.spot_types?.includes("buy") || spot.spot_types?.includes("experience")) {
    return "#f97316"; // orange — 결제 가능
  }
  if (spot.spot_types?.includes("start")) return "#10b981"; // emerald
  if (spot.spot_types?.includes("end")) return "#475569"; // slate
  return "#7c3aed"; // violet default
}

/**
 * Directions API로 도보 경로를 받아오고, 실패하면 스팟간 직선으로 폴백.
 * 한 번에 11개 미만 waypoints까지만 보내며(Directions API 제약), 초과 시 직선 폴백.
 */
function RoutePolyline({
  spots,
  precomputedPath,
  precomputedProvider,
  onStatusChange,
}: {
  spots: HaruSpot[];
  precomputedPath: LatLng[] | null;
  precomputedProvider: "google" | "osrm" | null;
  onStatusChange: (s: PolylineStatus) => void;
}) {
  const spotsKey = useMemo(() => spots.map((s) => s.id).join("|"), [spots]);
  const straightPath = useMemo<LatLng[]>(
    () => spots.map((s) => ({ lat: s.catalog.lat, lng: s.catalog.lng })),
    [spots],
  );

  // 결과를 spotsKey와 함께 보관 → spots가 바뀌면 displayPath가 자동으로 직선으로 폴백.
  const [routedFor, setRoutedFor] = useState<{ key: string; path: LatLng[] } | null>(null);
  // 시도 완료 여부 — fetch 끝났는데 결과 없음 → "straight"
  const [fetchSettledFor, setFetchSettledFor] = useState<string | null>(null);

  const hasPrecomputed = precomputedPath != null && precomputedPath.length >= 2;
  // 라우팅 부적합 좌표 — 즉시 "straight" 상태로 유도(setState 없이 derive)
  const isInvalidForRouting = spots.length < 2 || spots.length > 25;

  useEffect(() => {
    if (hasPrecomputed || isInvalidForRouting) return;
    let cancelled = false;
    const coordinates = spots.map((s) => ({ lat: s.catalog.lat, lng: s.catalog.lng }));

    async function tryFetch(endpoint: string): Promise<LatLng[] | null> {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coordinates, profile: "foot" }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { path?: LatLng[] };
        return data.path?.length ? data.path : null;
      } catch {
        return null;
      }
    }

    (async () => {
      const google = await tryFetch("/api/routing/google");
      if (cancelled) return;
      if (google) {
        setRoutedFor({ key: spotsKey, path: google });
        setFetchSettledFor(spotsKey);
        return;
      }
      const osrm = await tryFetch("/api/routing/osrm");
      if (cancelled) return;
      if (osrm) {
        setRoutedFor({ key: spotsKey, path: osrm });
      }
      setFetchSettledFor(spotsKey);
    })();

    return () => {
      cancelled = true;
    };
  }, [spots, spotsKey, hasPrecomputed, isInvalidForRouting]);

  // 상태를 props·state에서 유도해서 부모로 알림 (effect 안의 setState 폭주 회피)
  const matched = routedFor?.key === spotsKey ? routedFor.path : null;
  let status: PolylineStatus;
  if (hasPrecomputed) status = "routed";
  else if (matched) status = "routed";
  else if (isInvalidForRouting) status = "straight";
  else if (fetchSettledFor === spotsKey) status = "straight";
  else status = "loading";

  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  if (hasPrecomputed) {
    void precomputedProvider; // 표시는 안 하지만 시그니처 유지 (디버그·향후 배지용)
    return <PolylineOverlay path={precomputedPath!} dashed={false} />;
  }

  return <PolylineOverlay path={matched ?? straightPath} dashed={matched == null} />;
}

function PolylineOverlay({ path, dashed }: { path: LatLng[]; dashed: boolean }) {
  const map = useMap();
  if (typeof window === "undefined") return null;
  if (!map) return null;
  return <PolylineAttacher map={map} path={path} dashed={dashed} />;
}

function PolylineAttacher({
  map,
  path,
  dashed,
}: {
  map: google.maps.Map;
  path: LatLng[];
  dashed: boolean;
}) {
  useEffect(() => {
    if (!map || path.length < 2) return;
    const polyline = new google.maps.Polyline({
      path,
      strokeColor: "#7c3aed",
      // dashed(직선 폴백)은 stroke를 투명으로 두고 점선 심볼로만 표현
      strokeOpacity: dashed ? 0 : 0.85,
      strokeWeight: 3,
      map,
      icons: dashed
        ? [
            {
              icon: {
                path: "M 0,-1 0,1",
                strokeOpacity: 0.7,
                strokeColor: "#7c3aed",
                scale: 3,
              },
              offset: "0",
              repeat: "10px",
            },
          ]
        : [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 2.5,
                fillOpacity: 1,
                strokeOpacity: 0,
              },
              offset: "100%",
            },
          ],
    });
    return () => {
      polyline.setMap(null);
    };
  }, [map, path, dashed]);

  return null;
}
