import { THANKS_PLATFORM_FEE_RATE } from "@/lib/feature-flags";
import type { ThanksAmountBreakdown } from "@/types/thanks-payment";

export function computeThanksBreakdown(amount: number, feeRate = THANKS_PLATFORM_FEE_RATE): ThanksAmountBreakdown {
  const grossAmount = Math.max(0, Math.floor(amount));
  const platformFeeAmount = Math.floor(grossAmount * feeRate);
  const haruiAmount = grossAmount - platformFeeAmount;
  return {
    grossAmount,
    platformFeeRate: feeRate,
    platformFeeAmount,
    haruiAmount,
  };
}
