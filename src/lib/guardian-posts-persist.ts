import type { GuardianPostSavePayload } from "@/lib/guardian-posts-api";
import { isUuidString, resolveAuthorUserId } from "@/lib/guardian-posts-api";
import { processContentPostPointsAfterWrite } from "@/lib/points/point-hooks";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export type GuardianPostSaveResult =
  | { ok: true; id: string; saved: true }
  | { ok: true; saved: false; message: string; preview?: unknown }
  | { ok: false; error: string; status?: number };

export async function insertGuardianContentPost(payload: GuardianPostSavePayload): Promise<GuardianPostSaveResult> {
  const authorUuid = resolveAuthorUserId(payload.author_user_id);
  if (!authorUuid) {
    return {
      ok: false,
      error:
        "Could not resolve author_user_id to a UUID. Set GUARDIAN_AUTHOR_USER_MAP or DEFAULT_GUARDIAN_AUTHOR_USER_ID.",
      status: 400,
    };
  }

  const sb = createServiceRoleSupabase();
  if (!sb) {
    return {
      ok: true,
      saved: false,
      message:
        "Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Nothing was written.",
      preview: payload,
    };
  }

  const { data: region, error: re } = await sb.from("regions").select("id").eq("slug", payload.region_slug).maybeSingle();
  const { data: category, error: ce } = await sb
    .from("content_categories")
    .select("id")
    .eq("slug", payload.category_slug)
    .maybeSingle();

  if (re || !region?.id) {
    return { ok: false, error: `Unknown region_slug: ${payload.region_slug}`, status: 400 };
  }
  if (ce || !category?.id) {
    return { ok: false, error: `Unknown category_slug: ${payload.category_slug}`, status: 400 };
  }

  const highlights = payload.route_highlights ?? [];

  const { data, error } = await sb
    .from("content_posts")
    .insert({
      author_user_id: authorUuid,
      region_id: region.id,
      category_id: category.id,
      kind: payload.kind,
      title: payload.title.trim() || "(untitled)",
      summary: payload.summary.trim() || null,
      body: payload.body,
      tags: payload.tags,
      status: payload.status,
      post_format: payload.post_format ?? null,
      cover_image_url: payload.cover_image_url ?? null,
      hero_subject: payload.hero_subject ?? null,
      structured_content: payload.structured_content ?? null,
      route_journey: payload.route_journey,
      route_highlights: highlights,
      usefulness_votes: 0,
      popular_score: 0,
      recommended_score: 0,
      featured: false,
      is_sample: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[guardian-posts-persist] insert", error);
    return { ok: false, error: error.message, status: 500 };
  }

  await processContentPostPointsAfterWrite(data.id);

  return { ok: true, id: data.id, saved: true };
}

export async function updateGuardianContentPost(
  postId: string,
  payload: GuardianPostSavePayload,
): Promise<GuardianPostSaveResult> {
  if (!isUuidString(postId)) {
    return { ok: false, error: "postId must be a UUID", status: 400 };
  }

  const authorUuid = resolveAuthorUserId(payload.author_user_id);
  if (!authorUuid) {
    return { ok: false, error: "Could not resolve author_user_id", status: 400 };
  }

  const sb = createServiceRoleSupabase();
  if (!sb) {
    return {
      ok: true,
      saved: false,
      message: "Supabase not configured — nothing persisted.",
      preview: payload,
    };
  }

  const { data: existing, error: fe } = await sb
    .from("content_posts")
    .select("id, author_user_id")
    .eq("id", postId)
    .maybeSingle();

  if (fe || !existing) {
    return { ok: false, error: "Post not found", status: 404 };
  }
  if (existing.author_user_id !== authorUuid) {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const { data: region, error: re } = await sb.from("regions").select("id").eq("slug", payload.region_slug).maybeSingle();
  const { data: category, error: ce } = await sb
    .from("content_categories")
    .select("id")
    .eq("slug", payload.category_slug)
    .maybeSingle();

  if (re || !region?.id) {
    return { ok: false, error: `Unknown region_slug: ${payload.region_slug}`, status: 400 };
  }
  if (ce || !category?.id) {
    return { ok: false, error: `Unknown category_slug: ${payload.category_slug}`, status: 400 };
  }

  const highlights = payload.route_highlights ?? [];

  const { error } = await sb
    .from("content_posts")
    .update({
      region_id: region.id,
      category_id: category.id,
      kind: payload.kind,
      title: payload.title.trim() || "(untitled)",
      summary: payload.summary.trim() || null,
      body: payload.body,
      tags: payload.tags,
      status: payload.status,
      post_format: payload.post_format ?? null,
      cover_image_url: payload.cover_image_url ?? null,
      hero_subject: payload.hero_subject ?? null,
      structured_content: payload.structured_content ?? null,
      route_journey: payload.route_journey,
      route_highlights: highlights,
    })
    .eq("id", postId);

  if (error) {
    console.error("[guardian-posts-persist] update", error);
    return { ok: false, error: error.message, status: 500 };
  }

  await processContentPostPointsAfterWrite(postId);

  return { ok: true, id: postId, saved: true };
}
