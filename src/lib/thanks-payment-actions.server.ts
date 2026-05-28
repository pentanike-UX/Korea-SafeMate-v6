"use server";

import { getTranslations } from "next-intl/server";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import {
  THANKS_AMOUNT_MAX,
  THANKS_AMOUNT_MIN,
  THANKS_DUPLICATE_GUARD_SEC,
  THANKS_MESSAGE_MAX_LENGTH,
} from "@/lib/feature-flags";
import { computeThanksBreakdown } from "@/lib/thanks-payment-math";
import { mockHaruRoute } from "@/data/mock/haru-route";
import { ensureRouteReadyForThanks } from "@/lib/routes/ensure-route-ready-for-thanks.server";

function isDemoMockRouteId(routeId: string) {
  return routeId === mockHaruRoute.id || routeId === "mock";
}

export async function submitThanksPaymentAction(input: {
  routeId: string;
  haruiUserId: string;
  amount: number;
  message?: string | null;
  source?: string | null;
}): Promise<
  | {
      ok: true;
      paymentId: string;
      breakdown: ReturnType<typeof computeThanksBreakdown>;
      haruiDisplayName: string;
      routeTitle: string;
    }
  | { ok: false; error: string }
> {
  const payerId = await getSupabaseAuthUserIdOnly();
  if (!payerId) return { ok: false, error: "login-required" };

  const amount = Math.floor(input.amount);
  if (amount < THANKS_AMOUNT_MIN || amount > THANKS_AMOUNT_MAX) {
    return { ok: false, error: "invalid-amount" };
  }

  const message = input.message?.trim().slice(0, THANKS_MESSAGE_MAX_LENGTH) || null;
  const breakdown = computeThanksBreakdown(amount);

  if (isDemoMockRouteId(input.routeId)) {
    if (input.haruiUserId !== mockHaruRoute.guardian.user_id) {
      return { ok: false, error: "harui-mismatch" };
    }
    if (payerId === mockHaruRoute.guardian.user_id) {
      return { ok: false, error: "own-route" };
    }
    const title = mockHaruRoute.title.ko ?? mockHaruRoute.title.en ?? "Route";
    return {
      ok: true,
      paymentId: `thanks_mock_${Date.now()}`,
      breakdown,
      haruiDisplayName: mockHaruRoute.guardian.display_name,
      routeTitle: title,
    };
  }

  const ready = await ensureRouteReadyForThanks(input.routeId, input.haruiUserId);
  if (!ready.ok) return { ok: false, error: ready.error };
  const routeRow = ready.route;
  if (routeRow.guardian_user_id === payerId) return { ok: false, error: "own-route" };

  const svc = createServiceRoleSupabase();
  if (!svc) return { ok: false, error: "service-unavailable" };

  const since = new Date(Date.now() - THANKS_DUPLICATE_GUARD_SEC * 1000).toISOString();
  const { data: recent } = await svc
    .from("thanks_payments")
    .select("id")
    .eq("route_id", input.routeId)
    .eq("payer_user_id", payerId)
    .eq("gross_amount", amount)
    .eq("status", "paid")
    .gte("paid_at", since)
    .limit(1);
  if (recent?.length) return { ok: false, error: "duplicate-payment" };

  const receiptId = `thanks_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const sb = await getServerSupabaseForUser();
  if (!sb) return { ok: false, error: "unauthorized" };

  const { data: profile } = await sb
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", payerId)
    .maybeSingle();

  const { data: inserted, error: insErr } = await sb
    .from("thanks_payments")
    .insert({
      route_id: input.routeId,
      harui_user_id: input.haruiUserId,
      payer_user_id: payerId,
      payer_display_name: profile?.display_name?.trim() || null,
      gross_amount: breakdown.grossAmount,
      platform_fee_rate: breakdown.platformFeeRate,
      platform_fee_amount: breakdown.platformFeeAmount,
      harui_amount: breakdown.haruiAmount,
      pg_fee_amount: 0,
      message,
      status: "paid",
      payment_provider: "demo",
      payment_key: receiptId,
      source: input.source ?? "route-detail",
      paid_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insErr || !inserted) {
    if (insErr?.code === "42P01") return { ok: false, error: "table-missing" };
    return { ok: false, error: insErr?.message ?? "insert-failed" };
  }

  const { data: gp } = await svc
    .from("guardian_profiles")
    .select("display_name")
    .eq("user_id", input.haruiUserId)
    .maybeSingle();

  const routeTitle =
    (routeRow.title_ko as string | null)?.trim() ||
    (routeRow.title_en as string | null)?.trim() ||
    "Route";

  return {
    ok: true,
    paymentId: inserted.id as string,
    breakdown,
    haruiDisplayName: (gp?.display_name as string | null)?.trim() || "Harui",
    routeTitle,
  };
}

export async function getThanksSuccessCopy() {
  const t = await getTranslations("TravelerHub");
  return {
    title: t("thanksSuccessTitle"),
    body: t("thanksSuccessBody"),
  };
}
