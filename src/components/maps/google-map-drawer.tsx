"use client";

import { useEffect, useRef, useState } from "react";
import { Map, AdvancedMarker, useApiIsLoaded, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Search, X, AlertCircle } from "lucide-react";

/** GoogleMapDrawer가 반환하는 핀 선택 결과. */
export interface MapPickResult {
  lat: number;
  lng: number;
  /** 선택된 장소가 Place라면 함께 반환 — 에디터에서 자동 채움에 활용 가능. */
  place?: {
    placeId: string;
    name: string;
    formattedAddress?: string;
  };
}

/**
 * 큰 드로어 형태의 Google Maps 선택기.
 * - Places Autocomplete로 검색 → 결과 클릭 시 핀 자동 이동
 * - 지도 클릭 시 자유 핀 배치 (place 정보 없이 좌표만)
 * - "이 위치 선택" 확정 시 onConfirm으로 결과 반환
 *
 * env `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 미설정 시 비활성 상태 안내 카드 노출.
 */
export function GoogleMapDrawer({
  open,
  onOpenChange,
  title,
  initial,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 헤더 타이틀 — 예: "스팟 3 위치 선택" */
  title: string;
  /** 시작 좌표·핀. 미설정 시 서울 중심으로 시작. */
  initial?: { lat: number; lng: number };
  onConfirm: (result: MapPickResult) => void;
}) {
  const keyConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-[640px] data-[side=right]:lg:max-w-[860px] data-[side=right]:xl:max-w-[1000px]"
        aria-label={title}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-border/50 bg-card px-4 py-3.5">
          <MapPin className="size-4 text-[var(--brand-primary)]" aria-hidden />
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{title}</p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </header>

        {keyConfigured ? (
          <MapDrawerBody initial={initial} onConfirm={onConfirm} onClose={() => onOpenChange(false)} />
        ) : (
          <MissingKeyNotice />
        )}
      </SheetContent>
    </Sheet>
  );
}

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };

function MapDrawerBody({
  initial,
  onConfirm,
  onClose,
}: {
  initial?: { lat: number; lng: number };
  onConfirm: (result: MapPickResult) => void;
  onClose: () => void;
}) {
  const isLoaded = useApiIsLoaded();
  const [pin, setPin] = useState<MapPickResult | null>(
    initial ? { lat: initial.lat, lng: initial.lng } : null,
  );

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Google Maps 로드 중…</span>
      </div>
    );
  }

  const center = pin ?? initial ?? SEOUL_CENTER;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 검색 + 결과 */}
      <PlacesAutocompleteRow
        onSelect={(r) => setPin(r)}
      />

      {/* 지도 */}
      <div className="relative flex-1 overflow-hidden bg-muted">
        <Map
          mapId="haru-route-picker"
          defaultCenter={center}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          onClick={(ev) => {
            const ll = ev.detail.latLng;
            if (!ll) return;
            setPin({ lat: ll.lat, lng: ll.lng });
          }}
          style={{ width: "100%", height: "100%" }}
        >
          {pin ? <AdvancedMarker position={{ lat: pin.lat, lng: pin.lng }} /> : null}
          <MapPanWhenPinChanges pin={pin} />
        </Map>
      </div>

      {/* 푸터 — 핀 상태 + 확정 */}
      <footer className="flex shrink-0 items-center gap-3 border-t border-border/50 bg-card px-4 py-3">
        <div className="min-w-0 flex-1">
          {pin ? (
            <>
              <p className="truncate text-[12px] font-semibold text-foreground">
                {pin.place?.name ?? "선택된 위치"}
              </p>
              <p className="truncate text-[10.5px] text-muted-foreground">
                {pin.place?.formattedAddress
                  ? pin.place.formattedAddress
                  : `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`}
              </p>
            </>
          ) : (
            <p className="text-[11.5px] text-muted-foreground">
              검색하거나 지도를 클릭해 위치를 선택하세요.
            </p>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          취소
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!pin}
          onClick={() => {
            if (pin) {
              onConfirm(pin);
              onClose();
            }
          }}
        >
          이 위치 선택
        </Button>
      </footer>
    </div>
  );
}

/** 핀이 검색·클릭으로 갱신될 때 지도 중앙을 부드럽게 이동. */
function MapPanWhenPinChanges({ pin }: { pin: MapPickResult | null }) {
  const map = useMap();
  const lat = pin?.lat;
  const lng = pin?.lng;
  useEffect(() => {
    if (!map || lat == null || lng == null) return;
    map.panTo({ lat, lng });
  }, [map, lat, lng]);
  return null;
}

function PlacesAutocompleteRow({ onSelect }: { onSelect: (r: MapPickResult) => void }) {
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [hint, setHint] = useState<string>("");

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;
    const ac = new placesLib.Autocomplete(inputRef.current, {
      fields: ["place_id", "name", "formatted_address", "geometry"],
      // 서울/수도권 중심 바이어스
      bounds: new google.maps.LatLngBounds(
        { lat: 37.413, lng: 126.764 },
        { lat: 37.715, lng: 127.184 },
      ),
      strictBounds: false,
      componentRestrictions: { country: "kr" },
    });

    autocompleteRef.current = ac;
    const listener = ac.addListener("place_changed", () => {
      const p = ac.getPlace();
      const loc = p.geometry?.location;
      if (!loc || !p.place_id || !p.name) {
        setHint("선택한 장소에 좌표가 없습니다. 다른 결과를 선택해 보세요.");
        return;
      }
      setHint("");
      onSelect({
        lat: loc.lat(),
        lng: loc.lng(),
        place: {
          placeId: p.place_id,
          name: p.name,
          formattedAddress: p.formatted_address,
        },
      });
    });

    return () => {
      listener.remove();
      autocompleteRef.current = null;
    };
  }, [placesLib, onSelect]);

  return (
    <div className="shrink-0 border-b border-border/50 bg-background px-4 py-2.5 space-y-1">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          ref={inputRef}
          placeholder="장소·상호·주소로 검색 (예: 경복궁 근정전)"
          className="rounded-xl pl-8"
        />
      </div>
      {hint ? (
        <p className="text-[10.5px] text-amber-700 dark:text-amber-400">{hint}</p>
      ) : (
        <p className="text-[10.5px] text-muted-foreground">
          검색 결과를 선택하거나 지도에서 직접 클릭해도 됩니다.
        </p>
      )}
    </div>
  );
}

function MissingKeyNotice() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md rounded-2xl border border-amber-300/40 bg-amber-50/60 p-5 text-center dark:bg-amber-950/20">
        <AlertCircle className="mx-auto mb-2 size-6 text-amber-600" aria-hidden />
        <p className="mb-1 text-sm font-bold text-foreground">Google Maps 키가 설정되지 않았습니다</p>
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Vercel 환경변수에 <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>를 추가하고 Maps JavaScript API + Places API 권한을 활성화하세요. HTTP referrer 제한 권장.
        </p>
      </div>
    </div>
  );
}
