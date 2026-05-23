"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ToggleSavedRouteResult {
  ok: boolean;
  saved?: boolean;
  error?: string;
}

/** 루트 북마크 토글. UUID 루트만 대상(mock/preview 제외). RLS가 본인 소유를 강제. */
export async function toggleSavedRouteAction(routeId: string): Promise<ToggleSavedRouteResult> {
  if (!UUID_RE.test(routeId)) {
    return { ok: false, error: "이 루트는 저장할 수 없습니다." };
  }
  const userId = await getSupabaseAuthUserIdOnly();
  const sb = await getServerSupabaseForUser();
  if (!userId || !sb) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  const { data: existing } = await sb
    .from("traveler_saved_routes")
    .select("route_id")
    .eq("traveler_user_id", userId)
    .eq("route_id", routeId)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from("traveler_saved_routes")
      .delete()
      .eq("traveler_user_id", userId)
      .eq("route_id", routeId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/mypage/routes");
    return { ok: true, saved: false };
  }

  const { error } = await sb
    .from("traveler_saved_routes")
    .insert({ traveler_user_id: userId, route_id: routeId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mypage/routes");
  return { ok: true, saved: true };
}
