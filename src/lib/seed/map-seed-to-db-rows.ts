import type { ContentPost, GuardianProfile } from "@/types/domain";
import { isUuidString } from "@/lib/guardian-posts-api";
import { postHasRouteJourney } from "@/lib/content-post-route";
import { profileStatusFromApproval } from "@/lib/seed/map-guardian-profile-status";
import { seedContentPostUuid, seedGuardianUserUuid } from "@/lib/seed/deterministic-uuid";

export type SampleGuardianLanguageRow = {
  guardian_user_id: string;
  language_code: string;
  proficiency: string;
};

/** Row shape for `public.guardian_profiles` insert (IDs resolved — use with service role). */
export function guardianProfileToDbRow(
  g: GuardianProfile,
  opts: { user_id: string; primary_region_id: string | null; is_sample: boolean; seed_guardian_key: string },
): Record<string, unknown> {
  return {
    user_id: opts.user_id,
    display_name: g.display_name,
    headline: g.headline || null,
    bio: g.bio || null,
    guardian_tier: g.guardian_tier,
    approval_status: g.approval_status,
    profile_status: profileStatusFromApproval(g.approval_status),
    primary_region_id: opts.primary_region_id,
    years_in_seoul: g.years_in_seoul,
    photo_url: g.photo_url,
    avatar_image_url: g.avatar_image_url ?? null,
    list_card_image_url: g.list_card_image_url ?? null,
    detail_hero_image_url: g.detail_hero_image_url ?? null,
    intro_gallery_image_urls: g.intro_gallery_image_urls ?? [],
    posts_approved_last_30d: g.posts_approved_last_30d,
    posts_approved_last_7d: g.posts_approved_last_7d,
    featured: g.featured,
    influencer_seed: g.influencer_seed,
    matching_enabled: g.matching_enabled,
    avg_traveler_rating: g.avg_traveler_rating,
    expertise_tags: g.expertise_tags,
    is_sample: opts.is_sample,
    seed_guardian_key: opts.seed_guardian_key,
  };
}

export function guardianLanguagesToDbRows(g: GuardianProfile, guardianUserId: string): SampleGuardianLanguageRow[] {
  return g.languages.map((l) => ({
    guardian_user_id: guardianUserId,
    language_code: l.language_code,
    proficiency: l.proficiency,
  }));
}

/**
 * Resolve canonical UUID for a seed guardian key (`mg01`) or pass through real UUIDs.
 */
export function resolveGuardianUserIdForSeed(guardianKeyOrUuid: string): string {
  const t = guardianKeyOrUuid.trim();
  if (isUuidString(t)) return t;
  return seedGuardianUserUuid(t);
}

/** Scalar fields for `content_posts` — merge with `id`, `author_user_id`, `region_id`, `category_id` at insert time. */
export function contentPostToDbScalars(post: ContentPost): Record<string, unknown> {
  const post_format: string = post.post_format ?? (postHasRouteJourney(post) ? "route" : "article");
  return {
    kind: post.kind,
    title: post.title,
    summary: post.summary?.trim() ? post.summary : null,
    body: post.body,
    tags: post.tags,
    usefulness_votes: post.usefulness_votes,
    helpful_rating: post.helpful_rating,
    popular_score: post.popular_score,
    recommended_score: post.recommended_score,
    featured: post.featured,
    status: post.status,
    post_format,
    cover_image_url: post.cover_image_url ?? null,
    route_journey: post.route_journey ?? null,
    route_highlights: post.route_highlights ?? [],
    hero_subject: post.hero_subject ?? null,
    structured_content: post.structured_content ?? null,
    created_at: post.created_at,
  };
}

/**
 * `content_posts` insert shape (resolved FK ids). `structured_content` is JSON-compatible; `route_journey` includes optional `structured_exposure_meta`.
 */
export function contentPostToDbRow(
  post: ContentPost,
  opts: {
    id: string;
    author_user_id: string;
    region_id: string;
    category_id: string;
    is_sample: boolean;
    seed_content_key: string;
  },
): Record<string, unknown> {
  return {
    ...contentPostToDbScalars(post),
    id: opts.id,
    author_user_id: opts.author_user_id,
    region_id: opts.region_id,
    category_id: opts.category_id,
    is_sample: opts.is_sample,
    seed_content_key: opts.seed_content_key,
  };
}

/** Stable key for posts from current mock (`seed-mg10-ap-01`). */
export function seedContentKeyFromPost(post: ContentPost): string {
  return post.id.trim();
}

/** Seed guardian key from mock author id (`mg01`) or null if not a seed-shaped id. */
export function seedGuardianKeyFromString(authorId: string): string | null {
  const t = authorId.trim();
  if (/^mg\d{2}$/i.test(t)) return t.toLowerCase();
  return null;
}

export function resolvePostIdForSeed(post: ContentPost): string {
  const key = seedContentKeyFromPost(post);
  if (isUuidString(key)) return key;
  return seedContentPostUuid(key);
}
