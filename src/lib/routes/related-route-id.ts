import { seedUuidV5 } from "@/lib/seed/deterministic-uuid";
import { resolvePostIdForSeed } from "@/lib/seed/map-seed-to-db-rows";
import { postHasRouteJourney } from "@/lib/content-post-route";
import type { ContentPost } from "@/types/domain";

export const ROUTE_FROM_POST_NS = "safemate:route-from-post:";

/** `syncRouteFromPost`와 동일한 deterministic route UUID. */
export function routeIdForPostId(postId: string): string {
  return seedUuidV5(`${ROUTE_FROM_POST_NS}${postId}`);
}

/** DB FK 또는 journey 기반 deterministic ID. */
export function resolveRelatedRouteId(post: ContentPost): string | null {
  const linked = post.related_route_id?.trim();
  if (linked) return linked;
  if (!postHasRouteJourney(post)) return null;
  const canonicalPostId = resolvePostIdForSeed(post);
  return routeIdForPostId(canonicalPostId);
}

export function enrichContentPostRelatedRoute<T extends ContentPost>(post: T): T {
  const rid = resolveRelatedRouteId(post);
  if (!rid) return post;
  if (post.related_route_id === rid) return post;
  return { ...post, related_route_id: rid };
}
