import type { ContentPost } from "@/types/domain";

/** 탐색 카드 등 — 태그에서 지역 느낌 또는 서울 폴백 */
export function routeCardAreaLabel(post: ContentPost): string {
  const fromTag = post.tags.find((x) => x.includes("권"));
  if (fromTag) return fromTag;
  if (post.region_slug === "seoul") return "서울";
  return post.region_slug || "서울";
}

/** 대표 스팟 1~2개 한 줄 (실존명 우선) */
export function routeCardSpotPreviewLine(post: ContentPost, max = 2): string | null {
  const spots = post.route_journey?.spots;
  if (!spots?.length) return null;
  const sorted = [...spots].sort((a, b) => a.order - b.order);
  return sorted
    .slice(0, max)
    .map((s) => s.real_place_name || s.display_name || s.place_name)
    .join(" · ");
}
