/**
 * 가디언 식별자 정규화 (서버 전용).
 *
 * 입력은 uuid 또는 시드 슬러그(mg01..mg15) 또는 알 수 없는 문자열일 수 있다.
 * 모든 가디언 식별자 입력 경계 — 특히 /api/threads, /api/matches 등 —
 * 에서 본 헬퍼로 정규화해 DB에 항상 uuid만 들어가도록 보장한다.
 *
 * 우선순위:
 *  1) 이미 uuid 형식  → 그대로
 *  2) MOCK_GUARDIAN_UUID_MAP 즉시 매핑 (mg01..mg15 슬러그)
 *  3) guardian_profiles.seed_guardian_key 조회 (시드 외 슬러그 대비)
 *  4) not_found
 */
import { isUuidString } from "@/lib/guardian-posts-api";
import { MOCK_GUARDIAN_UUID_MAP } from "@/lib/dev/mock-guardian-auth";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export type NormalizedGuardianRef =
  | { ok: true; uuid: string; source: "uuid" | "mock_map" | "db_seed" }
  | { ok: false; reason: "invalid" | "not_found" };

export async function normalizeGuardianRef(ref: string | null | undefined): Promise<NormalizedGuardianRef> {
  const t = (ref ?? "").trim();
  if (!t) return { ok: false, reason: "invalid" };
  if (isUuidString(t)) return { ok: true, uuid: t, source: "uuid" };
  const mapped = MOCK_GUARDIAN_UUID_MAP[t];
  if (mapped) return { ok: true, uuid: mapped, source: "mock_map" };
  const sb = createServiceRoleSupabase();
  if (!sb) return { ok: false, reason: "not_found" };
  const { data } = await sb
    .from("guardian_profiles")
    .select("user_id")
    .eq("seed_guardian_key", t)
    .maybeSingle();
  const uid = (data?.user_id as string | undefined) ?? null;
  if (!uid) return { ok: false, reason: "not_found" };
  return { ok: true, uuid: uid, source: "db_seed" };
}
