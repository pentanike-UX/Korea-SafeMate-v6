/**
 * 클라이언트 전용 — 슈퍼관리자 모의 세션 미러·쿠키 읽기.
 * 쿠키는 httpOnly가 아니므로 document.cookie로 확인합니다.
 */

import {
  MOCK_SUPER_ADMIN_COOKIE_NAME,
  MOCK_SUPER_ADMIN_COOKIE_VALUE,
  isMockSuperAdminCookieValue,
} from "@/lib/dev/mock-super-admin-auth";

/** 새로고침 후 헤더 등과 동기화하기 위한 로컬 미러 (쿠키와 함께 유지) */
export const MOCK_SUPER_ADMIN_LOCAL_STORAGE_KEY = "safemate_mock_super_admin_active";

function parseCookieValue(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    const eq = part.indexOf("=");
    const n = eq >= 0 ? part.slice(0, eq) : part;
    if (n === name) {
      const raw = eq >= 0 ? part.slice(eq + 1) : "";
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return undefined;
}

export function readMockSuperAdminCookieFromDocument(): boolean {
  const v = parseCookieValue(MOCK_SUPER_ADMIN_COOKIE_NAME);
  return isMockSuperAdminCookieValue(v);
}

export function syncMockSuperAdminLocalMirrorFromCookie(): void {
  try {
    if (readMockSuperAdminCookieFromDocument()) {
      localStorage.setItem(MOCK_SUPER_ADMIN_LOCAL_STORAGE_KEY, MOCK_SUPER_ADMIN_COOKIE_VALUE);
    } else {
      localStorage.removeItem(MOCK_SUPER_ADMIN_LOCAL_STORAGE_KEY);
    }
  } catch {
    /* ignore private mode / quota */
  }
}

export function setMockSuperAdminLocalMirror(active: boolean): void {
  try {
    if (active) {
      localStorage.setItem(MOCK_SUPER_ADMIN_LOCAL_STORAGE_KEY, MOCK_SUPER_ADMIN_COOKIE_VALUE);
    } else {
      localStorage.removeItem(MOCK_SUPER_ADMIN_LOCAL_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}
