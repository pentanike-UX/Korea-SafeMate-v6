import type { PublicGuardian } from "@/lib/guardian-public";
import type { ContentPost } from "@/types/domain";
import type { GuardianImageSource } from "@/lib/guardian-profile-images";

export type GuardianProfileSheetPreview = GuardianImageSource & {
  display_name: string;
  headline?: string | null;
  long_bio?: { ko: string; en: string } | null;
  primary_region_slug?: string | null;
  guardian_tier?: string | null;
  languages?: Array<{ language_code: string }>;
  review_count_display?: number | null;
  avg_traveler_rating?: number | null;
  expertise_tags?: string[];
  companion_style_slugs?: string[];
  representativePosts?: Pick<ContentPost, "id" | "title" | "summary">[];
  /** 대표 id로 해석됨 | 폴백으로 최신 승인 글만 채운 경우(시트 힌트용) */
  representativePostsSource?: "curated" | "recent_approved";
};

export function publicGuardianToSheetPreview(
  g: PublicGuardian,
  repPosts: Pick<ContentPost, "id" | "title" | "summary">[],
  representativePostsSource?: "curated" | "recent_approved",
): GuardianProfileSheetPreview {
  return {
    user_id: g.user_id,
    photo_url: g.photo_url,
    avatar_image_url: g.avatar_image_url ?? null,
    list_card_image_url: g.list_card_image_url ?? null,
    detail_hero_image_url: g.detail_hero_image_url ?? null,
    display_name: g.display_name,
    headline: g.headline,
    long_bio: g.long_bio ?? null,
    primary_region_slug: g.primary_region_slug,
    guardian_tier: g.guardian_tier,
    languages: g.languages,
    review_count_display: g.review_count_display,
    avg_traveler_rating: g.avg_traveler_rating,
    expertise_tags: g.expertise_tags,
    companion_style_slugs: g.companion_style_slugs,
    representativePosts: repPosts.slice(0, 3),
    ...(representativePostsSource ? { representativePostsSource } : {}),
  };
}
