import type { ContentPost, RouteAccessStatus } from "@/types/domain";

/**
 * 하루루트 접근 상태 결정 유틸 — 기존 `hasPlaybookPremium` boolean과 호환.
 * 실제 PG 결제 연동 전까지 mock 단계의 게이팅 분기를 형식화한다.
 *
 * - free: 가격 없음 → 전체 공개
 * - paid: 결제 완료 / 본인 소유 / 관리자
 * - preview: 결제 전 미리보기 (제한 정보 + CTA)
 * - requires_payment: 결제 필요 (잠금 + 결제 안내)
 *
 * 본 단계는 컴포넌트가 boolean으로 받을 수 있도록 `statusToHasPremium` 헬퍼도 함께 제공.
 */
export interface RouteAccessInput {
  /** 본인 소유 콘텐츠 (작성자 본인) */
  isOwner?: boolean;
  /** 관리자/슈퍼관리자 */
  isAdmin?: boolean;
  /** mock 결제 완료 상태 (테스트 토글) */
  isPaidMock?: boolean;
  /** 명시적 무료 콘텐츠 표시 (예: 가격 0) */
  isFreeContent?: boolean;
  /** 비로그인 미리보기 (?preview=1 등) */
  isPreviewQuery?: boolean;
}

export function resolveRouteAccessStatus(input: RouteAccessInput): RouteAccessStatus {
  if (input.isOwner || input.isAdmin || input.isPaidMock) return "paid";
  if (input.isFreeContent) return "free";
  if (input.isPreviewQuery) return "preview";
  return "requires_payment";
}

/** 기존 `hasPlaybookPremium` boolean과 매핑. */
export function statusToHasPremium(status: RouteAccessStatus): boolean {
  return status === "paid" || status === "free";
}

/** ContentPost에서 자동으로 무료 여부를 추출. 본 단계는 보수적으로 false. */
export function inferFreeContent(_post: Pick<ContentPost, "is_sample"> | null | undefined): boolean {
  // 추후 RouteJourney.metadata에 price/is_paid 필드 도입 시 여기서 폴백.
  return false;
}
