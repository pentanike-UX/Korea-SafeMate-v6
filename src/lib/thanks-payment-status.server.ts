import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export type RouteThanksViewerStatus = {
  isOwnRoute: boolean;
  hasPriorThanks: boolean;
};

/** SSR — 고마움 CTA 노출·문구 분기용. */
export async function getRouteThanksViewerStatusServer(input: {
  routeId: string;
  haruiUserId: string | null;
  viewerUserId: string | null;
}): Promise<RouteThanksViewerStatus> {
  if (!input.viewerUserId || !input.haruiUserId) {
    return { isOwnRoute: false, hasPriorThanks: false };
  }

  if (input.viewerUserId === input.haruiUserId) {
    return { isOwnRoute: true, hasPriorThanks: false };
  }

  const svc = createServiceRoleSupabase();
  if (!svc) return { isOwnRoute: false, hasPriorThanks: false };

  const { count } = await svc
    .from("thanks_payments")
    .select("id", { count: "exact", head: true })
    .eq("route_id", input.routeId)
    .eq("payer_user_id", input.viewerUserId)
    .eq("status", "paid");

  return { isOwnRoute: false, hasPriorThanks: (count ?? 0) > 0 };
}
