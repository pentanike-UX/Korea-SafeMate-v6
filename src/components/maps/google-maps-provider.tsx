"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import type { ReactNode } from "react";

/**
 * Google Maps JavaScript API 클라이언트 Provider — `@vis.gl/react-google-maps`.
 *
 * env: `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` (HTTP referrer 제한 권장)
 *
 * 서버측 `GOOGLE_MAPS_API_KEY`(Places Text/Details/Photo)와는 별도 키로 운영하는 게
 * 보안상 안전. 클라이언트 드로어가 Places Autocomplete를 쓰므로 브라우저 키에도
 * Maps JavaScript API + Places API를 활성화해야 한다.
 *
 * 키가 비어있으면 children을 그대로 렌더 — 내부 컴포넌트에서 `useApiIsLoaded` 등으로
 * 분기해 비활성 상태를 표시한다.
 */
export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;

  if (!apiKey) {
    // 키 미설정 — provider 없이 children만 노출. 내부에서 비활성 UI 표시.
    return <>{children}</>;
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["places", "marker"]} language="ko" region="KR">
      {children}
    </APIProvider>
  );
}

/** 빌드/런타임에서 키 설정 여부 확인. */
export function isGoogleMapsKeyConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY);
}
