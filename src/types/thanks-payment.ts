export type ThanksPaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export type ThanksPaymentRow = {
  id: string;
  route_id: string;
  harui_user_id: string;
  payer_user_id: string | null;
  payer_display_name: string | null;
  gross_amount: number;
  platform_fee_rate: number;
  platform_fee_amount: number;
  harui_amount: number;
  pg_fee_amount: number;
  message: string | null;
  status: ThanksPaymentStatus;
  payment_provider: string | null;
  payment_key: string | null;
  source: string | null;
  created_at: string;
  paid_at: string | null;
};

export type ThanksAmountBreakdown = {
  grossAmount: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  haruiAmount: number;
};
