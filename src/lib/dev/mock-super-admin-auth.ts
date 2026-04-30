/**
 * 슈퍼관리자 모의 세션.
 * ENABLE_SUPER_ADMIN_LOGIN=1 환경변수로 활성화합니다 (dev·staging·production 공통).
 * 제거 시: 이 모듈 + /api/dev/mock-super-admin-login + MockSuperAdminLogin 컴포넌트를 함께 삭제.
 */

export const MOCK_SUPER_ADMIN_COOKIE_NAME = "safemate_mock_super_admin";
export const MOCK_SUPER_ADMIN_COOKIE_VALUE = "1";

/**
 * 슈퍼관리자 로그인 기능이 활성화되어 있는지 확인합니다.
 * 서버 전용 — NEXT_PUBLIC_ 접두어 없이 Vercel 환경변수에 추가하세요.
 */
export function isSuperAdminLoginEnabled(): boolean {
  return process.env.ENABLE_SUPER_ADMIN_LOGIN === "1";
}

/** 서버·미들웨어에서 쿠키 값으로 슈퍼관리자 여부를 판단합니다. */
export function isMockSuperAdminCookieValue(v: string | undefined): boolean {
  return v === MOCK_SUPER_ADMIN_COOKIE_VALUE;
}
