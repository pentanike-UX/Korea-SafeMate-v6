import { cookies } from "next/headers";
import { mockTravelerSavedPostIds } from "@/data/mock/traveler-hub";
import { isMockGuardianId } from "@/lib/dev/mock-guardian-auth";
import { isUuidString } from "@/lib/guardian-posts-api";
import { listApprovedPostsMerged } from "@/lib/posts-public-merged.server";
import { listPublicGuardiansMerged } from "@/lib/guardian-public-merged.server";
import {
  parseSavedGuardianIds,
  TRAVELER_SAVED_GUARDIANS_COOKIE,
} from "@/lib/traveler-saved-guardians-cookie";
import { parseSavedPostIds, TRAVELER_SAVED_POSTS_COOKIE } from "@/lib/traveler-saved-posts-cookie";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

async function listDbSavedGuardianIds(travelerUserId: string): Promise<string[]> {
  const sb = createServiceRoleSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("traveler_saved_guardians")
    .select("guardian_user_id")
    .eq("traveler_user_id", travelerUserId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => r.guardian_user_id as string);
}

async function syncCookieSavedGuardiansToDb(travelerUserId: string): Promise<void> {
  const sb = createServiceRoleSupabase();
  if (!sb) return;
  const jar = await cookies();
  const raw = parseSavedGuardianIds(jar.get(TRAVELER_SAVED_GUARDIANS_COOKIE)?.value);
  const uuidIds = [...new Set(raw.filter(isUuidString))];
  if (uuidIds.length === 0) return;
  const publicG = await listPublicGuardiansMerged();
  const allow = new Set(publicG.map((g) => g.user_id).filter(isUuidString));
  const rows = uuidIds.filter((id) => allow.has(id)).map((guardian_user_id) => ({ traveler_user_id: travelerUserId, guardian_user_id }));
  if (rows.length === 0) return;
  await sb.from("traveler_saved_guardians").upsert(rows, { onConflict: "traveler_user_id,guardian_user_id" });
}

async function listDbSavedPostIds(travelerUserId: string): Promise<string[]> {
  const sb = createServiceRoleSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("traveler_saved_posts")
    .select("post_id")
    .eq("traveler_user_id", travelerUserId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => r.post_id as string);
}

async function syncCookieSavedPostsToDb(travelerUserId: string): Promise<void> {
  const sb = createServiceRoleSupabase();
  if (!sb) return;
  const jar = await cookies();
  const raw = parseSavedPostIds(jar.get(TRAVELER_SAVED_POSTS_COOKIE)?.value);
  const uuidIds = [...new Set(raw.filter(isUuidString))];
  if (uuidIds.length === 0) return;
  const approved = await listApprovedPostsMerged();
  const allow = new Set(approved.filter((p) => p.status === "approved").map((p) => p.id).filter(isUuidString));
  const rows = uuidIds.filter((id) => allow.has(id)).map((post_id) => ({ traveler_user_id: travelerUserId, post_id }));
  if (rows.length === 0) return;
  await sb.from("traveler_saved_posts").upsert(rows, { onConflict: "traveler_user_id,post_id" });
}

/**
 * 모의 세션(mg*)은 쿠키·목 데이터, 실제 UUID 로그인은 DB(최초 1회 쿠키 → DB 이관).
 */
export async function getTravelerSavedGuardianIdsUnified(travelerUserId: string | null): Promise<string[]> {
  if (!travelerUserId || isMockGuardianId(travelerUserId)) {
    const jar = await cookies();
    return parseSavedGuardianIds(jar.get(TRAVELER_SAVED_GUARDIANS_COOKIE)?.value);
  }
  let ids = await listDbSavedGuardianIds(travelerUserId);
  if (ids.length === 0) {
    await syncCookieSavedGuardiansToDb(travelerUserId);
    ids = await listDbSavedGuardianIds(travelerUserId);
  }
  return ids;
}

export async function getTravelerSavedPostIdsUnified(travelerUserId: string | null): Promise<string[]> {
  if (!travelerUserId || isMockGuardianId(travelerUserId)) {
    return [...mockTravelerSavedPostIds];
  }
  let ids = await listDbSavedPostIds(travelerUserId);
  if (ids.length === 0) {
    await syncCookieSavedPostsToDb(travelerUserId);
    ids = await listDbSavedPostIds(travelerUserId);
  }
  return ids;
}
