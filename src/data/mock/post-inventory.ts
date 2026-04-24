import type { ContentPost } from "@/types/domain";
import { postHasRouteJourney } from "@/lib/content-post-route";
import { isExternalPostImageUrl } from "@/lib/post-local-images";
import { mockContentPosts } from "@/data/mock/content-posts";

export type PostInventoryRow = {
  slug: string;
  title: string;
  region: string;
  guardian: string;
  classification: "route_post" | "practical_tip_post";
  image_state: "local_assigned" | "local_plan_only" | "external_or_missing";
  rewrite_applied: "sample_overlay" | "practical_template" | "none";
  needs_manual_review: boolean;
};

function imageState(p: ContentPost): PostInventoryRow["image_state"] {
  const c = p.cover_image_url?.trim();
  if (c && !isExternalPostImageUrl(c)) return "local_assigned";
  if (postHasRouteJourney(p) && p.route_journey?.spots.some((s) => s.image_urls.some((u) => u && !isExternalPostImageUrl(u))))
    return "local_assigned";
  if (c && isExternalPostImageUrl(c)) return "external_or_missing";
  return "local_plan_only";
}

function rewriteApplied(p: ContentPost): PostInventoryRow["rewrite_applied"] {
  return p.is_sample ? "sample_overlay" : "practical_template";
}

/** 전수 인벤토리 — `mockContentPosts` 기준(시드 + 오버레이 + 비샘플 정규화 후) */
export function getMockPostInventory(): PostInventoryRow[] {
  return mockContentPosts.map((p) => ({
    slug: p.id,
    title: p.title,
    region: p.region_slug,
    guardian: p.author_display_name,
    classification: postHasRouteJourney(p) ? "route_post" : "practical_tip_post",
    image_state: imageState(p),
    rewrite_applied: rewriteApplied(p),
    needs_manual_review: Boolean(p.status === "draft" || p.status === "rejected"),
  }));
}
