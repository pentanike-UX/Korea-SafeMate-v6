"use client";

import { useSyncExternalStore } from "react";
import { subscribeClientAuthContextChanged } from "@/lib/auth/client-auth-tab-sync";
import {
  MOCK_SUPER_ADMIN_LOCAL_STORAGE_KEY,
  readMockSuperAdminCookieFromDocument,
  syncMockSuperAdminLocalMirrorFromCookie,
} from "@/lib/dev/mock-super-admin-client";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === MOCK_SUPER_ADMIN_LOCAL_STORAGE_KEY || e.key === null) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  const unsub = subscribeClientAuthContextChanged(onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    unsub();
  };
}

function getSnapshot(): boolean {
  if (typeof document === "undefined") return false;
  syncMockSuperAdminLocalMirrorFromCookie();
  return readMockSuperAdminCookieFromDocument();
}

function getServerSnapshot(): boolean {
  return false;
}

/** 슈퍼관리자 모의 세션(쿠키) 여부. SSR 스냅샷은 항상 false입니다. */
export function useMockSuperAdminSession(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
