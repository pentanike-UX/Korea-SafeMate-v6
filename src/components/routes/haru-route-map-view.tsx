"use client";

import { useMemo } from "react";
import {
  Map,
  AdvancedMarker,
  Pin,
  useApiIsLoaded,
} from "@vis.gl/react-google-maps";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HaruRoute, HaruSpot, AppLocale } from "@/types/haru";

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
}: {
  route: HaruRoute;
  locale: AppLocale;
  onSpotClick?: (spot: HaruSpot) => void;
  className?: string;
}) {
  const keyConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY);

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

  return <HaruRouteMapInner route={route} locale={locale} onSpotClick={onSpotClick} className={className} />;
}

function HaruRouteMapInner({
  route,
  locale,
  onSpotClick,
  className,
}: {
  route: HaruRoute;
  locale: AppLocale;
  onSpotClick?: (spot: HaruSpot) => void;
  className?: string;
}) {
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
        style={{ width: "100%", height: "min(70vh, 640px)" }}
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
        <RoutePolyline spots={spots} />
      </Map>
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
 * 스팟 순서대로 잇는 단순 폴리라인.
 * Maps JS의 google.maps.Polyline을 직접 사용 (vis.gl이 polyline 컴포넌트를 미제공).
 */
function RoutePolyline({ spots }: { spots: HaruSpot[] }) {
  const path = useMemo(
    () => spots.map((s) => ({ lat: s.catalog.lat, lng: s.catalog.lng })),
    [spots],
  );

  return <PolylineOverlay path={path} />;
}

function PolylineOverlay({ path }: { path: Array<{ lat: number; lng: number }> }) {
  const map = useMapForPolyline();
  // useEffect inside helper to attach polyline to map
  if (typeof window === "undefined") return null;
  if (!map) return null;

  // Render side-effectfully
  return <PolylineAttacher map={map} path={path} />;
}

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

function useMapForPolyline() {
  return useMap();
}

function PolylineAttacher({
  map,
  path,
}: {
  map: google.maps.Map;
  path: Array<{ lat: number; lng: number }>;
}) {
  useEffect(() => {
    if (!map || path.length < 2) return;
    const polyline = new google.maps.Polyline({
      path,
      strokeColor: "#7c3aed",
      strokeOpacity: 0.85,
      strokeWeight: 3,
      map,
      icons: [
        {
          icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2.5, fillOpacity: 1, strokeOpacity: 0 },
          offset: "100%",
        },
      ],
    });
    return () => {
      polyline.setMap(null);
    };
  }, [map, path]);

  return null;
}
