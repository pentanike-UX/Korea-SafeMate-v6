import { mockContentPosts } from "@/data/mock/content-posts";
import { postHasRouteJourney } from "@/lib/content-post-route";
import { buildSampleContentSeedPlan } from "@/lib/seed/build-sample-seed-plan";
import { resolvePostIdForSeed } from "@/lib/seed/map-seed-to-db-rows";
import { seedUuidV5 } from "@/lib/seed/deterministic-uuid";
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

/** `/posts/[postId]` URL에 쓸 공개 포스트 id (시드 키 우선). */
export function resolvePostPublicIdForRoute(routeId: string): string | null {
  for (const p of mockContentPosts) {
    if (!postHasRouteJourney(p)) continue;
    if (routeIdForPostId(resolvePostIdForSeed(p)) !== routeId) continue;
    return p.id;
  }
  const plan = buildSampleContentSeedPlan();
  for (const p of plan.posts) {
    if (routeIdForPostId(p.id) !== routeId) continue;
    return p.seed_content_key;
  }
  return null;
}

export function enrichContentPostRelatedRoute<T extends ContentPost>(post: T): T {
  const rid = resolveRelatedRouteId(post);
  if (!rid) return post;
  if (post.related_route_id === rid) return post;
  return { ...post, related_route_id: rid };
}
