import type { ContentPost } from "@/types/domain";
import { postHasRouteJourney } from "@/lib/content-post-route";

/** i18n key under `Posts` namespace — use with `t(key)`. */
export type PostTypeLabelKey =
  | "postTypeLabel.recommendedRoute"
  | "postTypeLabel.hybridGuide"
  | "postTypeLabel.spotGuide"
  | "postTypeLabel.practicalTip"
  | "postTypeLabel.localGuide"
  | "postTypeLabel.hotPlace"
  | "postTypeLabel.foodWalk"
  | "postTypeLabel.shoppingWalk"
  | "postTypeLabel.kContent"
  | "postTypeLabel.article";

export function resolvePostTypeLabelKey(post: ContentPost): PostTypeLabelKey {
  if (postHasRouteJourney(post)) return "postTypeLabel.recommendedRoute";
  const pf = post.post_format;
  if (pf === "hybrid") return "postTypeLabel.hybridGuide";
  if (pf === "spot") return "postTypeLabel.spotGuide";
  switch (post.kind) {
    case "practical":
      return "postTypeLabel.practicalTip";
    case "local_tip":
      return "postTypeLabel.localGuide";
    case "hot_place":
      return "postTypeLabel.hotPlace";
    case "food":
      return "postTypeLabel.foodWalk";
    case "shopping":
      return "postTypeLabel.shoppingWalk";
    case "k_content":
      return "postTypeLabel.kContent";
    default:
      return "postTypeLabel.article";
  }
}
