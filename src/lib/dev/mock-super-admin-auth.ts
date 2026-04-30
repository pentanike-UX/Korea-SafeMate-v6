/**
 * Dev/demo 전용 — 슈퍼관리자 모의 세션.
 * production에서는 쿠키를 절대 설정하지 않습니다.
 * 제거 시: 이 모듈 + /api/dev/mock-super-admin-login + MockSuperAdminLogin 컴포넌트를 함께 삭제.
 */

export const MOCK_SUPER_ADMIN_COOKIE_NAME = "safemate_mock_super_admin";
export const MOCK_SUPER_ADMIN_COOKIE_VALUE = "1";

/** 서버·미들웨어에서 쿠키 값으로 슈퍼관리자 여부를 판단합니다. */
export function isMockSuperAdminCookieValue(v: string | undefined): boolean {
  return v === MOCK_SUPER_ADMIN_COOKIE_VALUE;
}
