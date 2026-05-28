import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { formatThanksPayerLabel, type ThanksPayerKind } from "@/lib/thanks-payer-identity";
import type { HaruiThanksReceivedItem } from "@/types/mypage-hub";

export type HaruiThanksListItem = HaruiThanksReceivedItem;

export async function listThanksPaymentsForHarui(
  haruiUserId: string,
  limit = 30,
): Promise<HaruiThanksListItem[]> {
  const svc = createServiceRoleSupabase();
  if (!svc) return [];

  const { data, error } = await svc
    .from("thanks_payments")
    .select(
      "id, route_id, payer_kind, payer_display_name, gross_amount, harui_amount, message, paid_at, routes(title_ko, title_en)",
    )
    .eq("harui_user_id", haruiUserId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[listThanksPaymentsForHarui]", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const routes = row.routes as { title_ko?: string | null; title_en?: string | null } | null;
    const routeTitle =
      routes?.title_ko?.trim() || routes?.title_en?.trim() || "하루루트";
    const payer_kind = (row.payer_kind as ThanksPayerKind) ?? "member";
    return {
      id: row.id as string,
      route_id: row.route_id as string,
      route_title: routeTitle,
      payer_kind,
      payer_label: formatThanksPayerLabel({
        payer_kind,
        payer_display_name: row.payer_display_name as string | null,
      }),
      gross_amount: row.gross_amount as number,
      harui_amount: row.harui_amount as number,
      message: row.message as string | null,
      paid_at: row.paid_at as string,
    };
  });
}

export async function countThanksPaymentsForHarui(haruiUserId: string): Promise<number> {
  const svc = createServiceRoleSupabase();
  if (!svc) return 0;
  const { count } = await svc
    .from("thanks_payments")
    .select("id", { count: "exact", head: true })
    .eq("harui_user_id", haruiUserId)
    .eq("status", "paid");
  return count ?? 0;
}
