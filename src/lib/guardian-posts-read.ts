import type { ContentPost, ContentPostKind, ContentPostStatus } from "@/types/domain";
import type { RouteJourney } from "@/types/domain";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

type RawPost = {
  id: string;
  author_user_id: string;
  region_id: string;
  category_id: string;
  kind: string;
  title: string;
  summary: string | null;
  body: string;
  tags: string[];
  status: string;
  created_at: string;
  usefulness_votes: number;
  helpful_rating: number | null;
  popular_score: number;
  recommended_score: number;
  featured: boolean;
  post_format: string | null;
  cover_image_url: string | null;
  route_journey: RouteJourney | null;
  route_highlights: unknown;
};

function mapToContentPost(
  row: RawPost,
  region_slug: string,
  category_slug: string,
  author_display_name: string,
): ContentPost {
  const highlights = Array.isArray(row.route_highlights)
    ? row.route_highlights.filter((x): x is string => typeof x === "string")
    : [];
  return {
    id: row.id,
    author_user_id: row.author_user_id,
    author_display_name,
    region_slug,
    category_slug,
    kind: row.kind as ContentPostKind,
    title: row.title,
    body: row.body,
    summary: row.summary ?? "",
    status: row.status as ContentPostStatus,
    created_at: row.created_at,
    tags: row.tags ?? [],
    usefulness_votes: row.usefulness_votes,
    helpful_rating: row.helpful_rating,
    popular_score: row.popular_score,
    recommended_score: row.recommended_score,
    featured: row.featured,
    post_format: row.post_format as ContentPost["post_format"],
    cover_image_url: row.cover_image_url,
    route_journey: row.route_journey ?? undefined,
    route_highlights: highlights,
  };
}

/**
 * Load a single post for guardian preview (draft / pending / rejected).
 * Requires service role Supabase.
 */
export async function fetchGuardianPreviewPostById(postId: string): Promise<ContentPost | null> {
  const sb = createServiceRoleSupabase();
  if (!sb) return null;

  const { data: row, error } = await sb.from("content_posts").select("*").eq("id", postId).maybeSingle();

  if (error || !row) {
    if (error) console.error("[guardian-posts-read]", error);
    return null;
  }

  const p = row as RawPost;

  const [{ data: region }, { data: category }, { data: gp }] = await Promise.all([
    sb.from("regions").select("slug").eq("id", p.region_id).maybeSingle(),
    sb.from("content_categories").select("slug").eq("id", p.category_id).maybeSingle(),
    sb.from("guardian_profiles").select("display_name").eq("user_id", p.author_user_id).maybeSingle(),
  ]);

  if (!region?.slug || !category?.slug) return null;

  return mapToContentPost(p, region.slug, category.slug, gp?.display_name ?? "Guardian");
}
