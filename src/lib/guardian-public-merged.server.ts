import { cache } from "react";
import { mockGuardians } from "@/data/mock/guardians";
import type { GuardianLanguage, GuardianProfile } from "@/types/domain";
import { getPublicGuardianById, isActiveLaunchArea, mergePublicGuardian, type PublicGuardian } from "@/lib/guardian-public";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

/** `0`/`false` → DB 가디언만 + mock 보충 없음. 미설정 시 기존 병합 유지. */
function mergeSeedMockGuardiansEnabled(): boolean {
  const v = process.env.SAFE_MERGE_SEED_MOCK;
  return v !== "0" && v !== "false";
}

type GpRow = {
  user_id: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  guardian_tier: string;
  approval_status: string;
  years_in_seoul: number;
  photo_url: string | null;
  avatar_image_url: string | null;
  list_card_image_url: string | null;
  detail_hero_image_url: string | null;
  intro_gallery_image_urls: string[] | null;
  primary_region_id: string | null;
  posts_approved_last_30d: number;
  posts_approved_last_7d: number;
  featured: boolean;
  influencer_seed: boolean;
  matching_enabled: boolean;
  avg_traveler_rating: number | null;
  expertise_tags: string[] | null;
  is_sample?: boolean | null;
  seed_guardian_key?: string | null;
};

function mapProficiency(p: string): GuardianLanguage["proficiency"] {
  if (p === "basic" || p === "conversational" || p === "fluent" || p === "native") return p;
  return "conversational";
}

function toGuardianProfile(row: GpRow, primary_region_slug: string, languages: GuardianLanguage[]): GuardianProfile {
  return {
    user_id: row.user_id,
    display_name: row.display_name,
    headline: row.headline ?? "",
    bio: row.bio ?? "",
    guardian_tier: row.guardian_tier as GuardianProfile["guardian_tier"],
    approval_status: row.approval_status as GuardianProfile["approval_status"],
    years_in_seoul: row.years_in_seoul ?? 0,
    photo_url: row.photo_url,
    avatar_image_url: row.avatar_image_url,
    list_card_image_url: row.list_card_image_url,
    detail_hero_image_url: row.detail_hero_image_url,
    intro_gallery_image_urls: row.intro_gallery_image_urls ?? [],
    languages,
    primary_region_slug,
    posts_approved_last_30d: row.posts_approved_last_30d,
    posts_approved_last_7d: row.posts_approved_last_7d,
    featured: row.featured,
    influencer_seed: row.influencer_seed,
    matching_enabled: row.matching_enabled,
    avg_traveler_rating: row.avg_traveler_rating,
    expertise_tags: row.expertise_tags ?? [],
    ...(row.is_sample === true ? { is_sample: true } : {}),
  };
}

async function loadApprovedGuardiansFromDb(): Promise<GpRow[]> {
  const sb = createServiceRoleSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("guardian_profiles")
    .select(
      "user_id, display_name, headline, bio, guardian_tier, approval_status, years_in_seoul, photo_url, avatar_image_url, list_card_image_url, detail_hero_image_url, intro_gallery_image_urls, primary_region_id, posts_approved_last_30d, posts_approved_last_7d, featured, influencer_seed, matching_enabled, avg_traveler_rating, expertise_tags, is_sample, seed_guardian_key",
    )
    .eq("approval_status", "approved");
  if (error) {
    console.error("[listPublicGuardiansMerged]", error);
    return [];
  }
  return (data ?? []) as GpRow[];
}

/** 공개 가디언 목록 — 승인된 DB 프로필 + 시드 mock 병합(동일 user_id는 DB 우선) */
export const listPublicGuardiansMerged = cache(async (): Promise<PublicGuardian[]> => {
  const rows = await loadApprovedGuardiansFromDb();
  const sb = createServiceRoleSupabase();
  const langsById = new Map<string, GuardianLanguage[]>();

  if (sb && rows.length > 0) {
    const ids = rows.map((r) => r.user_id);
    const { data: langRows } = await sb.from("guardian_languages").select("*").in("guardian_user_id", ids);
    for (const l of langRows ?? []) {
      const arr = langsById.get(l.guardian_user_id) ?? [];
      arr.push({
        guardian_user_id: l.guardian_user_id,
        language_code: l.language_code,
        proficiency: mapProficiency(String(l.proficiency)),
      });
      langsById.set(l.guardian_user_id, arr);
    }
  }

  const regionIds = [...new Set(rows.map((r) => r.primary_region_id).filter(Boolean))] as string[];
  const regionSlugMap = new Map<string, string>();
  if (sb && regionIds.length > 0) {
    const { data: regs } = await sb.from("regions").select("id, slug").in("id", regionIds);
    for (const r of regs ?? []) regionSlugMap.set(r.id, r.slug as string);
  }

  const dbPublic: PublicGuardian[] = [];
  for (const row of rows) {
    const slug = row.primary_region_id ? regionSlugMap.get(row.primary_region_id) : undefined;
    const primary_region_slug = slug ?? "gwanghwamun";
    const langs = langsById.get(row.user_id) ?? [];
    const gp = toGuardianProfile(row, primary_region_slug, langs);
    dbPublic.push(mergePublicGuardian(gp));
  }

  const dbIds = new Set(dbPublic.map((g) => g.user_id));
  const mockRest = mergeSeedMockGuardiansEnabled()
    ? mockGuardians.filter((m) => !dbIds.has(m.user_id)).map((g) => mergePublicGuardian(g))
    : [];
  return [...dbPublic, ...mockRest];
});

export async function getPublicGuardianByIdMerged(userId: string): Promise<PublicGuardian | null> {
  const mock = getPublicGuardianById(userId);
  const sb = createServiceRoleSupabase();
  if (!sb) return mock;

  const selectCols =
    "user_id, display_name, headline, bio, guardian_tier, approval_status, years_in_seoul, photo_url, avatar_image_url, list_card_image_url, detail_hero_image_url, intro_gallery_image_urls, primary_region_id, posts_approved_last_30d, posts_approved_last_7d, featured, influencer_seed, matching_enabled, avg_traveler_rating, expertise_tags, is_sample, seed_guardian_key";

  const { data: byUid, error: errUid } = await sb
    .from("guardian_profiles")
    .select(selectCols)
    .eq("user_id", userId)
    .eq("approval_status", "approved")
    .maybeSingle();

  let row = !errUid ? byUid : null;
  if (!errUid && !row) {
    const { data: bySeed, error: errSeed } = await sb
      .from("guardian_profiles")
      .select(selectCols)
      .eq("seed_guardian_key", userId)
      .eq("approval_status", "approved")
      .maybeSingle();
    if (!errSeed) row = bySeed;
  }

  if (errUid || !row) return mock;

  const r = row as GpRow;
  let primary_region_slug = "gwanghwamun";
  if (r.primary_region_id) {
    const { data: reg } = await sb.from("regions").select("slug").eq("id", r.primary_region_id).maybeSingle();
    if (reg?.slug) primary_region_slug = reg.slug as string;
  }

  const { data: langRows } = await sb.from("guardian_languages").select("*").eq("guardian_user_id", r.user_id);
  const langs: GuardianLanguage[] =
    langRows?.map((l) => ({
      guardian_user_id: l.guardian_user_id,
      language_code: l.language_code,
      proficiency: mapProficiency(String(l.proficiency)),
    })) ?? [];

  const gp = toGuardianProfile(r, primary_region_slug, langs);
  return mergePublicGuardian(gp);
}

export async function listLaunchReadyGuardiansMerged(): Promise<PublicGuardian[]> {
  const all = await listPublicGuardiansMerged();
  return all.filter((x) => isActiveLaunchArea(x.launch_area_slug));
}
