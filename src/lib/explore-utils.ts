import type {
  ContentCategory,
  ContentPost,
  ExploreSortMode,
  GuardianProfile,
  Region,
} from "@/types/domain";

export type ExploreInsight = {
  post: ContentPost;
  regionName: string;
  regionSlug: string;
  categoryName: string;
  authorTier: GuardianProfile["guardian_tier"] | null;
  authorAvgRating: number | null;
  authorPosts30d: number | null;
  authorExpertiseTags: string[];
  hasGuardianProfile: boolean;
};

export function categoryNameFromSlug(
  slug: string,
  categories: ContentCategory[],
): string {
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}

export function regionNameFromSlug(slug: string, regions: Region[]): string {
  return regions.find((r) => r.slug === slug)?.name ?? slug;
}

export function enrichInsight(
  post: ContentPost,
  regions: Region[],
  categories: ContentCategory[],
  guardians: GuardianProfile[],
): ExploreInsight {
  const g = guardians.find((x) => x.user_id === post.author_user_id);
  return {
    post,
    regionName: regionNameFromSlug(post.region_slug, regions),
    regionSlug: post.region_slug,
    categoryName: categoryNameFromSlug(post.category_slug, categories),
    authorTier: g?.guardian_tier ?? null,
    authorAvgRating: g?.avg_traveler_rating ?? null,
    authorPosts30d: g?.posts_approved_last_30d ?? null,
    authorExpertiseTags: g?.expertise_tags ?? [],
    hasGuardianProfile: Boolean(g),
  };
}

export function sortInsights(
  insights: ExploreInsight[],
  mode: ExploreSortMode,
): ExploreInsight[] {
  const copy = [...insights];
  if (mode === "latest") {
    copy.sort(
      (a, b) =>
        new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime(),
    );
  } else if (mode === "popular") {
    copy.sort((a, b) => b.post.popular_score - a.post.popular_score);
  } else {
    copy.sort((a, b) => b.post.recommended_score - a.post.recommended_score);
  }
  return copy;
}

export function filterInsightsByCategory(
  insights: ExploreInsight[],
  categorySlug: string | null,
): ExploreInsight[] {
  if (!categorySlug) return insights;
  return insights.filter((i) => i.post.category_slug === categorySlug);
}

export function filterInsightsByRegion(
  insights: ExploreInsight[],
  regionSlug: string | null,
): ExploreInsight[] {
  if (!regionSlug) return insights;
  return insights.filter((i) => i.post.region_slug === regionSlug);
}
