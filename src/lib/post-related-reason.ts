import type { ContentPost } from "@/types/domain";

export type RelatedReasonTranslationKey =
  | "relatedReasonSameGuardian"
  | "relatedReasonSameRegion"
  | "relatedReasonSameCategory"
  | "relatedReasonSameFormat";

/** 우선순위: 같은 가디언 → 같은 지역 → 같은 카테고리 → 같은 포맷 */
export function resolveRelatedReasonKey(
  current: ContentPost,
  rel: ContentPost,
): RelatedReasonTranslationKey | null {
  if (rel.author_user_id === current.author_user_id) return "relatedReasonSameGuardian";
  if (rel.region_slug === current.region_slug) return "relatedReasonSameRegion";
  if (rel.category_slug === current.category_slug) return "relatedReasonSameCategory";
  if (rel.kind === current.kind) return "relatedReasonSameFormat";
  return null;
}
