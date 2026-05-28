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
import {
  normalizeGuestNickname,
  resolveMemberPayerDisplayName,
} from "@/lib/thanks-payer-identity";
import { createClient } from "@supabase/supabase-js";

function isDemoMockRouteId(routeId: string) {
  return routeId === mockHaruRoute.id || routeId === "mock";
}

export async function submitThanksPaymentAction(input: {
  routeId: string;
  haruiUserId: string;
  amount: number;
  message?: string | null;
  source?: string | null;
  /** 비회원 — 시트에서 입력한 닉네임 */
  guestNickname?: string | null;
  /** 비회원 — sessionStorage UUID */
  guestPayerKey?: string | null;
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
  const guestNickname = payerId ? null : normalizeGuestNickname(input.guestNickname ?? "");
  const guestPayerKey = payerId ? null : input.guestPayerKey?.trim() || null;

  if (!payerId && !guestNickname) {
    return { ok: false, error: "guest-nickname-required" };
  }
  if (!payerId && !guestPayerKey) {
    return { ok: false, error: "guest-key-required" };
  }

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
  if (payerId && routeRow.guardian_user_id === payerId) {
    return { ok: false, error: "own-route" };
  }

  const svc = createServiceRoleSupabase();

  const since = new Date(Date.now() - THANKS_DUPLICATE_GUARD_SEC * 1000).toISOString();

  if (payerId) {
    if (!svc) return { ok: false, error: "service-unavailable" };
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
  } else if (guestPayerKey) {
    if (svc) {
      const { data: recentGuest } = await svc
        .from("thanks_payments")
        .select("id")
        .eq("route_id", input.routeId)
        .eq("guest_payer_key", guestPayerKey)
        .eq("gross_amount", amount)
        .eq("status", "paid")
        .gte("paid_at", since)
        .limit(1);
      if (recentGuest?.length) return { ok: false, error: "duplicate-payment" };
    }
  }

  const receiptId = `thanks_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const paidAt = new Date().toISOString();

  if (payerId) {
    const sb = await getServerSupabaseForUser();
    if (!sb) return { ok: false, error: "unauthorized" };

    const payerDisplayName = await resolveMemberPayerDisplayName(sb, payerId);

    const { data: inserted, error: insErr } = await sb
      .from("thanks_payments")
      .insert({
        route_id: input.routeId,
        harui_user_id: input.haruiUserId,
        payer_kind: "member",
        payer_user_id: payerId,
        payer_display_name: payerDisplayName,
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
        paid_at: paidAt,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      if (insErr?.code === "42P01") return { ok: false, error: "table-missing" };
      return { ok: false, error: insErr?.message ?? "insert-failed" };
    }

    const haruiDisplayName = await resolveHaruiDisplayName(svc!, input.haruiUserId);
    const routeTitle =
      (routeRow.title_ko as string | null)?.trim() ||
      (routeRow.title_en as string | null)?.trim() ||
      "Route";

    return {
      ok: true,
      paymentId: inserted.id as string,
      breakdown,
      haruiDisplayName,
      routeTitle,
    };
  }

  const insertedId = await insertGuestThanks({
    svc,
    routeId: input.routeId,
    haruiUserId: input.haruiUserId,
    receiptId,
    paidAt,
    guestNickname,
    guestPayerKey,
    message,
    breakdown,
  });
  if (!insertedId.ok) return insertedId;

  const haruiDisplayName = svc ? await resolveHaruiDisplayName(svc, input.haruiUserId) : "Harui";
  const routeTitle =
    (routeRow.title_ko as string | null)?.trim() ||
    (routeRow.title_en as string | null)?.trim() ||
    "Route";

  return {
    ok: true,
    paymentId: insertedId.paymentId,
    breakdown,
    haruiDisplayName,
    routeTitle,
  };
}

async function resolveHaruiDisplayName(
  svc: NonNullable<ReturnType<typeof createServiceRoleSupabase>>,
  haruiUserId: string,
): Promise<string> {
  const { data: gp } = await svc
    .from("guardian_profiles")
    .select("display_name")
    .eq("user_id", haruiUserId)
    .maybeSingle();
  return (gp?.display_name as string | null)?.trim() || "Harui";
}

function createAnonSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function insertGuestThanks(input: {
  svc: ReturnType<typeof createServiceRoleSupabase>;
  routeId: string;
  haruiUserId: string;
  receiptId: string;
  paidAt: string;
  guestNickname: string | null;
  guestPayerKey: string | null;
  message: string | null;
  breakdown: ReturnType<typeof computeThanksBreakdown>;
}): Promise<{ ok: true; paymentId: string } | { ok: false; error: string }> {
  const {
    svc,
    routeId,
    haruiUserId,
    receiptId,
    paidAt,
    guestNickname,
    guestPayerKey,
    message,
    breakdown,
  } = input;

  if (svc) {
    const { data: inserted, error: insErr } = await svc
      .from("thanks_payments")
      .insert({
        route_id: routeId,
        harui_user_id: haruiUserId,
        payer_kind: "guest",
        payer_user_id: null,
        payer_display_name: guestNickname,
        guest_payer_key: guestPayerKey,
        gross_amount: breakdown.grossAmount,
        platform_fee_rate: breakdown.platformFeeRate,
        platform_fee_amount: breakdown.platformFeeAmount,
        harui_amount: breakdown.haruiAmount,
        pg_fee_amount: 0,
        message,
        status: "paid",
        payment_provider: "demo",
        payment_key: receiptId,
        source: "route-detail",
        paid_at: paidAt,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      if (insErr?.code === "42P01") return { ok: false, error: "table-missing" };
      const msg = insErr?.message ?? "";
      if (msg.includes("column") || msg.includes("payer_kind") || msg.includes("guest_payer_key")) {
        return { ok: false, error: "schema-mismatch" };
      }
      if (msg.includes("permission denied") || msg.includes("row-level security")) {
        return { ok: false, error: "service-unavailable" };
      }
      return { ok: false, error: insErr?.message ?? "insert-failed" };
    }

    return { ok: true, paymentId: inserted.id as string };
  }

  // Service role 없이도 동작하도록 — anon key로 SECURITY DEFINER RPC 호출.
  const anon = createAnonSupabase();
  if (!anon) return { ok: false, error: "service-unavailable" };
  const { data, error } = await anon.rpc("thanks_payments_insert_guest", {
    p_route_id: routeId,
    p_harui_user_id: haruiUserId,
    p_gross_amount: breakdown.grossAmount,
    p_message: message,
    p_source: "route-detail",
    p_guest_payer_key: guestPayerKey,
    p_payer_display_name: guestNickname,
    p_paid_at: paidAt,
    p_payment_key: receiptId,
    p_payment_provider: "demo",
  });

  if (error || !data) {
    const msg = error?.message ?? "";
    if (msg.includes("function") && msg.includes("does not exist")) return { ok: false, error: "schema-mismatch" };
    return { ok: false, error: "service-unavailable" };
  }
  return { ok: true, paymentId: data as string };
}

export async function getThanksSuccessCopy() {
  const t = await getTranslations("TravelerHub");
  return {
    title: t("thanksSuccessTitle"),
    body: t("thanksSuccessBody"),
  };
}
