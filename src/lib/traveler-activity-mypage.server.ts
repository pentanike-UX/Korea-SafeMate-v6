/**
 * 마이페이지 「이용·결제 기록」 허브 — 저장·패스·열람·공유 데이터 통합.
 */

import { getSessionUserId } from "@/lib/supabase/server-user";
import { getTravelerSavedPostIdsUnified } from "@/lib/traveler-saved-unified.server";
import { listApprovedPostsMerged } from "@/lib/posts-public-merged.server";
import {
  listMyRouteActivity,
  listMyRoutePasses,
  listReceivedSharedInvites,
  type ReceivedShareRow,
  type RecentViewRow,
  type RoutePassGrantRow,
  type RoutePassPackRow,
  type SharedInviteHistoryRow,
} from "@/lib/route-access-mypage.server";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export type TravelerSavedPostRow = {
  post_id: string;
  title: string;
  summary: string;
  related_route_id: string | null;
  saved_at: string | null;
};

export type TravelerActivitySummary = {
  saved_posts_count: number;
  active_grants_count: number;
  tickets_remaining: number;
  tickets_used: number;
  shares_sent_count: number;
  shares_sent_active: number;
  shares_received_count: number;
  recent_views_count: number;
};

export type TravelerActivityBundle = {
  summary: TravelerActivitySummary;
  savedPosts: TravelerSavedPostRow[];
  grants: RoutePassGrantRow[];
  packs: RoutePassPackRow[];
  recentViews: RecentViewRow[];
  sharedOut: SharedInviteHistoryRow[];
  sharedIn: ReceivedShareRow[];
  /** route_id → content post id (열람 루트에서 하루웨이 글로 연결) */
  postIdByRouteId: Record<string, string>;
};

export async function loadTravelerActivityBundle(
  locale: "ko" | "en" | "ja" | "th" | "vi",
): Promise<TravelerActivityBundle> {
  const userId = await getSessionUserId();
  const [{ grants, packs }, { recentViews, sharedInvites }, sharedIn, savedPostIds] =
    await Promise.all([
      listMyRoutePasses(locale),
      listMyRouteActivity(locale),
      listReceivedSharedInvites(locale),
      getTravelerSavedPostIdsUnified(userId),
    ]);

  const approved = await listApprovedPostsMerged();
  const approvedById = new Map(approved.map((p) => [p.id, p]));

  const savedPosts: TravelerSavedPostRow[] = [];
  for (const id of savedPostIds) {
    const p = approvedById.get(id);
    if (!p || p.status !== "approved") continue;
    savedPosts.push({
      post_id: p.id,
      title: p.title,
      summary: p.summary,
      related_route_id: p.related_route_id ?? null,
      saved_at: null,
    });
  }

  const tickets_remaining = packs.reduce((s, p) => s + p.tickets_remaining, 0);
  const tickets_used = packs.reduce((s, p) => s + p.tickets_used, 0);
  const shares_sent_active = sharedInvites.filter((i) => i.status === "active").length;

  const summary: TravelerActivitySummary = {
    saved_posts_count: savedPosts.length,
    active_grants_count: grants.length,
    tickets_remaining,
    tickets_used,
    shares_sent_count: sharedInvites.length,
    shares_sent_active,
    shares_received_count: sharedIn.length,
    recent_views_count: recentViews.length,
  };

  const routeIdsForPosts = [
    ...new Set(
      [...recentViews.map((v) => v.route_id), ...grants.map((g) => g.route_id)].filter((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
      ),
    ),
  ];
  const postIdByRouteId = await lookupPostIdsByRouteIds(routeIdsForPosts);

  return {
    summary,
    savedPosts,
    grants,
    packs,
    recentViews,
    sharedOut: sharedInvites,
    sharedIn,
    postIdByRouteId,
  };
}

async function lookupPostIdsByRouteIds(routeIds: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (routeIds.length === 0) return out;
  const svc = createServiceRoleSupabase();
  if (!svc) return out;
  const { data } = await svc
    .from("content_posts")
    .select("id, related_route_id")
    .in("related_route_id", routeIds)
    .eq("status", "approved");
  for (const row of (data ?? []) as Array<{ id: string; related_route_id: string | null }>) {
    if (row.related_route_id) out[row.related_route_id] = row.id;
  }
  return out;
}
