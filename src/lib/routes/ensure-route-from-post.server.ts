/**
 * 시드·샘플 포스트의 deterministic route UUID로 진입했을 때
 * `routes` / `route_spots` / `spot_catalog`가 없으면 `route_journey` 기준으로 생성한다.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { mockContentPosts } from "@/data/mock/content-posts";
import { postHasRouteJourney } from "@/lib/content-post-route";
import { buildSampleContentSeedPlan } from "@/lib/seed/build-sample-seed-plan";
import {
  resolveGuardianUserIdForSeed,
  resolvePostIdForSeed,
} from "@/lib/seed/map-seed-to-db-rows";
import { routeIdForPostId } from "@/lib/routes/related-route-id";
import { syncRouteFromPost } from "@/lib/routes/sync-route-from-post.server";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import type { RouteJourney } from "@/types/domain";

export type RouteSyncSource = {
  postId: string;
  authorUserId: string;
  routeJourney: RouteJourney;
  titleKo?: string | null;
  coverImageUrl?: string | null;
  postStatus: string;
  regionTags: string[];
};

function sourceFromMockPost(routeId: string): RouteSyncSource | null {
  for (const p of mockContentPosts) {
    if (!postHasRouteJourney(p)) continue;
    const postId = resolvePostIdForSeed(p);
    if (routeIdForPostId(postId) !== routeId) continue;
    return {
      postId,
      authorUserId: resolveGuardianUserIdForSeed(p.author_user_id),
      routeJourney: p.route_journey!,
      titleKo: p.title,
      coverImageUrl: p.cover_image_url ?? null,
      postStatus: p.status,
      regionTags: p.region_slug?.trim() ? [p.region_slug.trim()] : [],
    };
  }
  return null;
}

function sourceFromSeedPlan(routeId: string): RouteSyncSource | null {
  const plan = buildSampleContentSeedPlan();
  for (const p of plan.posts) {
    if (routeIdForPostId(p.id) !== routeId) continue;
    const postRow = p.post_row as Record<string, unknown>;
    const journey = postRow.route_journey as RouteJourney | null | undefined;
    if (!journey?.spots?.length) continue;
    return {
      postId: p.id,
      authorUserId: p.author_user_id,
      routeJourney: journey,
      titleKo: typeof postRow.title === "string" ? postRow.title : null,
      coverImageUrl: typeof postRow.cover_image_url === "string" ? postRow.cover_image_url : null,
      postStatus: typeof postRow.status === "string" ? postRow.status : "approved",
      regionTags: [p.region_slug],
    };
  }
  return null;
}

function rowToSource(
  row: {
    id: string;
    author_user_id: string;
    title: string | null;
    cover_image_url: string | null;
    status: string;
    route_journey: RouteJourney | null;
  },
  regionSlug: string | null,
): RouteSyncSource | null {
  const journey = row.route_journey;
  if (!journey?.spots?.length) return null;
  return {
    postId: row.id,
    authorUserId: row.author_user_id,
    routeJourney: journey,
    titleKo: row.title,
    coverImageUrl: row.cover_image_url,
    postStatus: row.status,
    regionTags: regionSlug?.trim() ? [regionSlug.trim()] : [],
  };
}

async function sourceFromDbPosts(sb: SupabaseClient, routeId: string): Promise<RouteSyncSource | null> {
  const { data: linked } = await sb
    .from("content_posts")
    .select("id, author_user_id, title, cover_image_url, status, route_journey, region_id")
    .eq("related_route_id", routeId)
    .maybeSingle();

  if (linked?.route_journey) {
    const regionSlug = await regionSlugForId(sb, linked.region_id as string | null);
    return rowToSource(linked as typeof linked & { route_journey: RouteJourney }, regionSlug);
  }

  const { data: samplePosts } = await sb
    .from("content_posts")
    .select("id, author_user_id, title, cover_image_url, status, route_journey, region_id")
    .eq("is_sample", true)
    .not("route_journey", "is", null);

  const regionSlugById = new Map<string, string>();
  for (const row of samplePosts ?? []) {
    if (routeIdForPostId(row.id as string) !== routeId) continue;
    let slug = regionSlugById.get(row.region_id as string);
    if (!slug && row.region_id) {
      slug = (await regionSlugForId(sb, row.region_id as string)) ?? undefined;
      if (slug) regionSlugById.set(row.region_id as string, slug);
    }
    const src = rowToSource(
      row as {
        id: string;
        author_user_id: string;
        title: string | null;
        cover_image_url: string | null;
        status: string;
        route_journey: RouteJourney | null;
      },
      slug ?? null,
    );
    if (src) return src;
  }

  return null;
}

async function regionSlugForId(sb: SupabaseClient, regionId: string | null): Promise<string | null> {
  if (!regionId) return null;
  const { data } = await sb.from("regions").select("slug").eq("id", regionId).maybeSingle();
  return (data?.slug as string | undefined)?.trim() || null;
}

async function ensureGuardianProfileForSync(sb: SupabaseClient, authorUserId: string): Promise<boolean> {
  const { data: existing } = await sb
    .from("guardian_profiles")
    .select("user_id")
    .eq("user_id", authorUserId)
    .maybeSingle();
  if (existing) return true;

  const plan = buildSampleContentSeedPlan();
  const guardian = plan.guardians.find((g) => g.user_id === authorUserId);
  if (!guardian) return false;

  const { data: userRow } = await sb.from("users").select("id").eq("id", authorUserId).maybeSingle();
  if (!userRow) return false;

  const { data: regions } = await sb.from("regions").select("id, slug");
  const regionId =
    regions?.find((r) => (r.slug as string) === guardian.primary_region_slug)?.id ?? null;

  const profileRow = {
    ...guardian.profile_row,
    primary_region_id: regionId,
  };
  const { error: gpErr } = await sb
    .from("guardian_profiles")
    .upsert(profileRow, { onConflict: "user_id" });
  if (gpErr) {
    console.error("[ensureGuardianProfileForSync] guardian_profiles", gpErr);
    return false;
  }

  if (guardian.language_rows.length > 0) {
    const { error: langErr } = await sb.from("guardian_languages").upsert(guardian.language_rows, {
      onConflict: "guardian_user_id,language_code",
    });
    if (langErr) {
      console.warn("[ensureGuardianProfileForSync] guardian_languages", langErr);
    }
  }

  return true;
}

export function resolveRouteSyncSource(routeId: string): RouteSyncSource | null {
  return sourceFromSeedPlan(routeId) ?? sourceFromMockPost(routeId);
}

/** `route_journey`가 있는 시드 포스트 전부를 DB에 materialize. */
export async function syncAllSeedRoutesFromPosts(sb: SupabaseClient): Promise<{
  attempted: number;
  synced: number;
  skippedGuardian: number;
}> {
  const plan = buildSampleContentSeedPlan();
  let attempted = 0;
  let synced = 0;
  let skippedGuardian = 0;

  for (const p of plan.posts) {
    const postRow = p.post_row as Record<string, unknown>;
    const journey = postRow.route_journey as RouteJourney | null | undefined;
    if (!journey?.spots?.length) continue;
    attempted += 1;

    const guardianOk = await ensureGuardianProfileForSync(sb, p.author_user_id);
    if (!guardianOk) {
      skippedGuardian += 1;
      continue;
    }

    const routeId = await syncRouteFromPost({
      sb,
      postId: p.id,
      authorUserId: p.author_user_id,
      routeJourney: journey,
      titleKo: typeof postRow.title === "string" ? postRow.title : null,
      coverImageUrl: typeof postRow.cover_image_url === "string" ? postRow.cover_image_url : null,
      postStatus: typeof postRow.status === "string" ? postRow.status : "approved",
      regionTags: [p.region_slug],
    });
    if (routeId) synced += 1;
  }

  return { attempted, synced, skippedGuardian };
}

/**
 * 루트 상세 진입 시 DB에 행이 없으면 포스트 journey로 upsert.
 * service role 미설정 시 false.
 */
export async function ensureRouteSyncedForView(routeId: string): Promise<boolean> {
  const sb = createServiceRoleSupabase();
  if (!sb) return false;

  const { data: existing } = await sb
    .from("routes")
    .select("id")
    .eq("id", routeId)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) return true;

  const source =
    (await sourceFromDbPosts(sb, routeId)) ??
    resolveRouteSyncSource(routeId);
  if (!source) return false;

  const guardianOk = await ensureGuardianProfileForSync(sb, source.authorUserId);
  if (!guardianOk) {
    console.warn("[ensureRouteSyncedForView] guardian unavailable", source.authorUserId);
    return false;
  }

  const syncedId = await syncRouteFromPost({
    sb,
    postId: source.postId,
    authorUserId: source.authorUserId,
    routeJourney: source.routeJourney,
    titleKo: source.titleKo,
    coverImageUrl: source.coverImageUrl,
    postStatus: source.postStatus,
    regionTags: source.regionTags,
  });

  return Boolean(syncedId);
}
