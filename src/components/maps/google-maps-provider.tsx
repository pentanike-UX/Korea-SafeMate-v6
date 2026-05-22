"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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
 *
 * 인증 실패(referrer 차단·API 미활성 등)는 Google이 `window.gm_authFailure`를 호출 →
 * 이 Provider가 잡아 context로 노출 → 자식 컴포넌트가 자체 진단 카드를 띄울 수 있다.
 */

interface GoogleMapsState {
  /** 키 미설정 또는 인증 실패 시 true. 자식 컴포넌트가 비활성 UI 분기에 사용. */
  unavailable: boolean;
  /** 실패가 인증·권한 문제(referrer/API 미활성)일 때 true. */
  authFailed: boolean;
}

const GoogleMapsStateContext = createContext<GoogleMapsState>({
  unavailable: true,
  authFailed: false,
});

export function useGoogleMapsState(): GoogleMapsState {
  return useContext(GoogleMapsStateContext);
}

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    if (!apiKey || typeof window === "undefined") return;
    // Google이 인증 실패 시 호출하는 글로벌 콜백. 우리는 한 번만 잡으면 됨.
    const prev = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      setAuthFailed(true);
      try {
        prev?.();
      } catch {
        // ignore — 우리가 첫 핸들러 등록인 게 일반적.
      }
    };
    return () => {
      // 다른 Provider가 있었을 수도 있으므로 직접 등록한 핸들러만 정리.
      const current = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
      if (current && current !== prev) {
        (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = prev;
      }
    };
  }, [apiKey]);

  const state: GoogleMapsState = {
    unavailable: !apiKey || authFailed,
    authFailed,
  };

  if (!apiKey) {
    return (
      <GoogleMapsStateContext.Provider value={state}>{children}</GoogleMapsStateContext.Provider>
    );
  }

  return (
    <GoogleMapsStateContext.Provider value={state}>
      <APIProvider apiKey={apiKey} libraries={["places", "marker"]} language="ko" region="KR">
        {children}
      </APIProvider>
    </GoogleMapsStateContext.Provider>
  );
}

/** 빌드/런타임에서 키 설정 여부 확인. */
export function isGoogleMapsKeyConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY);
}
