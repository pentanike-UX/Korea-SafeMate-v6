import type { ContentPost, RouteJourney, RouteSpot } from "@/types/domain";

function newSpot(order: number, lat = 37.5665, lng = 126.978): RouteSpot {
  return {
    id: `spot-init-${order}-${Math.random().toString(36).slice(2, 8)}`,
    order,
    title: "",
    place_name: "",
    short_description: "",
    body: "",
    image_urls: [],
    recommend_reason: "",
    stay_duration_minutes: 20,
    photo_tip: "",
    caution: "",
    lat,
    lng,
    featured: order === 0,
  };
}

function defaultJourney(): RouteJourney {
  const a = newSpot(0);
  const b = newSpot(1, 37.5675, 126.982);
  return {
    metadata: {
      transport_mode: "walk",
      estimated_total_duration_minutes: 90,
      estimated_total_distance_km: 2,
      recommended_time_of_day: "flexible",
      difficulty: "easy",
      recommended_traveler_types: ["first_timer"],
      night_friendly: false,
    },
    spots: [a, b],
    path: [
      { lat: a.lat, lng: a.lng },
      { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 },
      { lat: b.lat, lng: b.lng },
    ],
  };
}

export function createBlankRoutePost(author: { user_id: string; display_name: string }): ContentPost {
  return {
    id: `draft-${Date.now()}`,
    author_user_id: author.user_id,
    author_display_name: author.display_name,
    region_slug: "seoul",
    category_slug: "k-content",
    kind: "k_content",
    post_format: "hybrid",
    title: "",
    summary: "",
    body: "",
    status: "draft",
    created_at: new Date().toISOString(),
    tags: [],
    usefulness_votes: 0,
    helpful_rating: null,
    popular_score: 0,
    recommended_score: 0,
    featured: false,
    cover_image_url: null,
    route_journey: defaultJourney(),
    route_highlights: [],
  };
}
