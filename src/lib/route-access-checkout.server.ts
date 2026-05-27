"use server";

/**
 * Phase 3C — 결제 완료 후 grant/pack 생성 진입점.
 *
 * 현 상태: PlaybookUnlockSheet의 "fake" 결제 완료를 받아 실제 DB grant/pack을
 * 생성한다. 실 Toss/Kakao 콜백은 본 함수 안에 영수증 검증 로직만 추가하면
 * 동일한 경계를 그대로 사용 가능 — 호출 시그니처 변경 없음.
 *
 * 정책: docs/payment-and-share-policy.md §1
 */

import { getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import {
  createRouteSingleGrantAction,
  createRouteTicketPackAction,
  consumeRouteTicketAction,
} from "@/lib/route-access-actions.server";

export type CheckoutPlan = "pass_1" | "pass_3" | "pass_5" | "monthly_9900";

export async function confirmRouteCheckoutAction(input: {
  routeId: string;
  plan: CheckoutPlan;
  /** 실 PG 영수증 ID — 현재는 fake 토큰. Phase 3C+에서 PG SDK 응답으로 교체. */
  receiptId: string;
}): Promise<
  | { ok: true; grantId: string }
  | { ok: true; packId: string; consumedGrantId: string }
  | { ok: true; subscription: true } // 월구독 placeholder
  | { ok: false; error: string }
> {
  const userId = await getSupabaseAuthUserIdOnly();
  if (!userId) return { ok: false, error: "unauthorized" };
  if (!input.receiptId) return { ok: false, error: "missing-receipt" };

  // TODO(Phase 3C+): Toss/Kakao 영수증 검증 — 승인 금액·미사용 여부·해당 사용자 일치.

  if (input.plan === "pass_1") {
    const res = await createRouteSingleGrantAction({
      routeId: input.routeId,
      ownerUserId: userId,
      paymentReceiptId: input.receiptId,
    });
    if (!res.ok) return res;
    return { ok: true, grantId: res.grantId };
  }

  if (input.plan === "pass_3" || input.plan === "pass_5") {
    const packSize = input.plan === "pass_3" ? 3 : 5;
    const pack = await createRouteTicketPackAction({
      ownerUserId: userId,
      packSize,
      paymentReceiptId: input.receiptId,
    });
    if (!pack.ok) return pack;
    // 결제 직후 사용자는 현재 루트를 보려고 했음 — 그 자리에서 1장 즉시 소모.
    const consumed = await consumeRouteTicketAction({
      packId: pack.packId,
      routeId: input.routeId,
    });
    if (!consumed.ok) {
      // 패키지는 생성됐으니 사용자에게는 마이페이지에서 사용 안내. 실패 사유는 전달.
      return { ok: false, error: `pack-created-but-consume-failed:${consumed.error}` };
    }
    return { ok: true, packId: pack.packId, consumedGrantId: consumed.grantId };
  }

  if (input.plan === "monthly_9900") {
    // TODO: 월 구독은 별도 모델 — 현재는 placeholder.
    return { ok: true, subscription: true };
  }

  return { ok: false, error: "unknown-plan" };
}
