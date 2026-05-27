/**
 * 하루웨이 포스트 저장 시 — `route_journey` 기반으로 routes / route_spots /
 * spot_catalog 행을 자동 upsert하고 `content_posts.related_route_id`를 연결한다.
 *
 * 비즈니스 모델 (RelatedRouteBanner 주석 참조):
 *   하루이는 한 번의 입력으로 (post + route) 양쪽 자산을 생성한다.
 *   - 하루웨이(post): 콘텐츠/발견 (무료)
 *   - 하루루트(route): 실행 도구 (결제 발생 지점)
 *
 * 모든 mutation은 service-role 경유(routes/route_spots/spot_catalog는 가디언
 * 본인 외엔 일반 RLS로 쓰기 불가하지만, 본 함수는 author_user_id 검증을 이미
 * 마친 뒤 호출되므로 service-role을 그대로 사용).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { seedUuidV5 } from "@/lib/seed/deterministic-uuid";
import type { RouteJourney, RouteSpot } from "@/types/domain";

const ROUTE_FROM_POST_NS = "safemate:route-from-post:";
const SPOT_FROM_JOURNEY_NS = "safemate:spot-from-journey:";

function routeIdForPost(postId: string): string {
  return seedUuidV5(`${ROUTE_FROM_POST_NS}${postId}`);
}

/**
 * 같은 (lat, lng, name) 조합엔 항상 같은 spot_catalog.id가 나오도록 deterministic.
 * 1m 단위(6자리 소수)로 반올림해 사소한 좌표 흔들림으로 중복 행이 안 생기게 함.
 */
function spotIdForJourneyEntry(spot: RouteSpot): string {
  const lat = Number.isFinite(spot.lat) ? Math.round(spot.lat * 1e5) / 1e5 : 0;
  const lng = Number.isFinite(spot.lng) ? Math.round(spot.lng * 1e5) / 1e5 : 0;
  const key = `${spot.place_name?.trim() || spot.title?.trim() || "spot"}|${lat},${lng}`;
  return seedUuidV5(`${SPOT_FROM_JOURNEY_NS}${key}`);
}

const SPOT_CATEGORY_FALLBACK = "attraction" as const;
const ALLOWED_SPOT_CATEGORIES = new Set([
  "food",
  "cafe",
  "attraction",
  "shopping",
  "nightlife",
  "nature",
  "activity",
]);

function resolveSpotCategory(spot: RouteSpot): string {
  // RouteSpot에는 category 필드가 없으므로 휴리스틱(이름 키워드)로 추정.
  const t = `${spot.title} ${spot.place_name} ${spot.short_description ?? ""}`.toLowerCase();
  if (/카페|cafe|커피|coffee|디저트|dessert/.test(t)) return "cafe";
  if (/맛집|식당|food|restaurant|밥|음식|국밥|냉면|치킨/.test(t)) return "food";
  if (/쇼핑|shopping|시장|market|상점|store/.test(t)) return "shopping";
  if (/바|bar|클럽|club|야경|night/.test(t)) return "nightlife";
  if (/공원|park|산|mountain|숲|forest|강|river|해변|beach/.test(t)) return "nature";
  if (/체험|activity|클래스|class|투어|tour/.test(t)) return "activity";
  return SPOT_CATEGORY_FALLBACK;
}

function moveModeFromSpot(spot: RouteSpot): "walk" | "subway" | "taxi" | null {
  switch (spot.next_move_mode) {
    case "walk":
      return "walk";
    case "subway":
      return "subway";
    case "taxi":
      return "taxi";
    case "bus":
      // route_spots는 walk/subway/taxi 만 허용 — bus는 가장 가까운 subway로.
      return "subway";
    default:
      return null;
  }
}

/**
 * 가디언 포스트 저장 직후 호출 — content_posts.id, author_user_id, payload 기준으로
 * routes / route_spots / spot_catalog를 동기화한다.
 *
 * @returns 동기화된 route UUID. journey가 없거나 동기화 실패 시 null.
 */
export async function syncRouteFromPost(input: {
  sb: SupabaseClient;
  postId: string;
  authorUserId: string;
  routeJourney: RouteJourney | null | undefined;
  titleKo?: string | null;
  titleEn?: string | null;
  coverImageUrl?: string | null;
  postStatus: string;
  regionTags?: string[];
}): Promise<string | null> {
  const journey = input.routeJourney;
  if (!journey || !Array.isArray(journey.spots) || journey.spots.length === 0) {
    return null;
  }
  const spots = journey.spots
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (spots.length === 0) return null;

  const routeId = routeIdForPost(input.postId);

  // 1) spot_catalog upsert
  const spotRows = spots.map((s) => {
    const id = spotIdForJourneyEntry(s);
    const category = resolveSpotCategory(s);
    return {
      id,
      name_ko: s.place_name?.trim() || s.title?.trim() || "Spot",
      name_en: s.title?.trim() || null,
      address_ko: s.address_line ?? null,
      lat: s.lat,
      lng: s.lng,
      region_tags: input.regionTags ?? [],
      category: ALLOWED_SPOT_CATEGORIES.has(category) ? category : SPOT_CATEGORY_FALLBACK,
      avg_stay_min: s.stay_duration_minutes ?? null,
      source: "guardian_submitted",
      is_verified: true,
      is_active: true,
    };
  });
  const { error: spotErr } = await input.sb
    .from("spot_catalog")
    .upsert(spotRows, { onConflict: "id" });
  if (spotErr) {
    console.error("[syncRouteFromPost] spot_catalog upsert", spotErr);
    return null;
  }

  // 2) routes upsert — id를 deterministic으로 지정해 idempotent.
  const totalMin = journey.metadata?.estimated_total_duration_minutes ?? null;
  const status = input.postStatus === "approved" || input.postStatus === "published"
    ? "public"
    : "draft";

  const { error: routeErr } = await input.sb
    .from("routes")
    .upsert(
      {
        id: routeId,
        guardian_user_id: input.authorUserId,
        title_ko: input.titleKo ?? null,
        title_en: input.titleEn ?? null,
        region_tags: input.regionTags ?? [],
        total_duration_min: totalMin,
        cover_image_url: input.coverImageUrl ?? null,
        status,
        route_type: "sample",
      },
      { onConflict: "id" },
    );
  if (routeErr) {
    console.error("[syncRouteFromPost] routes upsert", routeErr);
    return null;
  }

  // 3) route_spots — delete + insert 패턴(순서·삭제 모두 처리)
  const { error: delErr } = await input.sb
    .from("route_spots")
    .delete()
    .eq("route_id", routeId);
  if (delErr) {
    console.error("[syncRouteFromPost] route_spots delete", delErr);
    return null;
  }
  const routeSpotRows = spots.map((s, idx) => ({
    route_id: routeId,
    spot_id: spotIdForJourneyEntry(s),
    sort_order: idx + 1,
    stay_min: Math.max(1, s.stay_duration_minutes ?? 30),
    guardian_note_ko: s.recommend_reason?.trim() || s.short_description?.trim() || null,
    move_from_prev_method: idx === 0 ? null : moveModeFromSpot(spots[idx - 1]!),
    move_from_prev_min: idx === 0 ? 0 : spots[idx - 1]!.next_move_minutes ?? null,
  }));
  const { error: insErr } = await input.sb.from("route_spots").insert(routeSpotRows);
  if (insErr) {
    console.error("[syncRouteFromPost] route_spots insert", insErr);
    return null;
  }

  // 4) content_posts.related_route_id 연결
  const { error: linkErr } = await input.sb
    .from("content_posts")
    .update({ related_route_id: routeId })
    .eq("id", input.postId);
  if (linkErr) {
    console.error("[syncRouteFromPost] content_posts.related_route_id update", linkErr);
    return null;
  }

  return routeId;
}
