/**
 * 하루루트 수익화·접근 feature flags.
 * v2026 무료 확산 + 고마움 결제 모델 — docs/payment-and-share-policy.md §7
 */

/** false: 공개 루트는 결제 없이 전체 열람. true: 레거시 유료 잠금(990/패스). */
export const ENABLE_PAID_ROUTE_LOCK =
  process.env.NEXT_PUBLIC_ENABLE_PAID_ROUTE_LOCK === "true";

/** true: 하루이에게 고마움 표현하기(선택 결제) UI·API 활성. */
export const ENABLE_THANKS_PAYMENT =
  process.env.NEXT_PUBLIC_ENABLE_THANKS_PAYMENT !== "false";

/** 무료 확산 모델에서 grant당 2명 초대 한도 적용 여부. */
export const ENABLE_ROUTE_SHARE_INVITE_LIMIT = ENABLE_PAID_ROUTE_LOCK;

export const THANKS_PLATFORM_FEE_RATE = 0.1;
export const THANKS_AMOUNT_PRESETS = [1000, 3000, 5000, 10000] as const;
export const THANKS_AMOUNT_MIN = 1000;
export const THANKS_AMOUNT_MAX = 100_000;
export const THANKS_MESSAGE_MAX_LENGTH = 200;

export const THANKS_MESSAGE_PRESETS = [
  "thanksPreset1",
  "thanksPreset2",
  "thanksPreset3",
  "thanksPreset4",
] as const;

/** 동일 금액 연속 결제 방지(초). */
export const THANKS_DUPLICATE_GUARD_SEC = 10;
