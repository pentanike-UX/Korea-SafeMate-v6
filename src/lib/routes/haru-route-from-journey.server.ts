import { mockGuardians } from "@/data/mock/guardians";
import type { RouteSyncSource } from "@/lib/routes/ensure-route-from-post.server";
import type { FetchedHaruBundle } from "@/lib/routes/haru-route-from-supabase.server";
import { resolveGuardianUserIdForSeed } from "@/lib/seed/map-seed-to-db-rows";
import type { RouteSpot } from "@/types/domain";
import type { HaruRoute, HaruSpot, LocaleMap, MoveMethod } from "@/types/haru";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍽️",
  cafe: "☕",
  attraction: "⭐",
  shopping: "🛍️",
  nightlife: "🌙",
  nature: "🌿",
  activity: "🎯",
  palace: "🏯",
  plaza: "🏛️",
};

function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category.toLowerCase()] ?? "📍";
}

function moveMode(spot: RouteSpot): MoveMethod | null {
  switch (spot.next_move_mode) {
    case "walk":
      return "walk";
    case "subway":
      return "subway";
    case "taxi":
      return "taxi";
    case "bus":
      return "subway";
    default:
      return null;
  }
}

function spotToHaru(spot: RouteSpot, idx: number): HaruSpot | null {
  if (!Number.isFinite(spot.lat) || !Number.isFinite(spot.lng)) return null;
  const name = spot.place_name?.trim() || spot.title?.trim() || "Spot";
  const category = spot.category?.trim() || "attraction";
  const note = spot.recommend_reason?.trim() || spot.short_description?.trim() || "";
  return {
    id: spot.id || `journey-spot-${idx + 1}`,
    order: spot.order ?? idx + 1,
    catalog: {
      name: { ko: name, en: name, th: name, vi: name },
      category,
      category_emoji: categoryEmoji(category),
      image_url: spot.images?.hero ?? spot.image_urls?.[0] ?? null,
      address: spot.address_line ?? spot.address ?? null,
      lat: spot.lat,
      lng: spot.lng,
    },
    stay_min: Math.max(1, spot.stay_duration_minutes ?? 30),
    guardian_note: { ko: note, en: note, th: note, vi: note },
    move_from_prev_method: idx === 0 ? null : moveMode(spot),
    move_from_prev_min: idx === 0 ? null : spot.next_move_minutes ?? null,
    featured: idx === 0,
  };
}

function guardianForAuthor(authorUserId: string) {
  const g = mockGuardians.find(
    (row) => resolveGuardianUserIdForSeed(row.user_id) === authorUserId,
  );
  return {
    user_id: authorUserId,
    display_name: g?.display_name ?? "Guardian",
    photo_url: g?.photo_url ?? g?.avatar_image_url ?? null,
    last_seen_at: null as string | null,
  };
}

function routeStatusFromPost(postStatus: string): string {
  return postStatus === "approved" || postStatus === "published" ? "public" : "draft";
}

/** DB 없이 시드·샘플 포스트 journey만으로 하루루트 뷰 데이터 구성. */
export function buildHaruRouteBundleFromSyncSource(
  routeId: string,
  source: RouteSyncSource,
): FetchedHaruBundle {
  const sorted = [...source.routeJourney.spots]
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const spots: HaruSpot[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const s = spotToHaru(sorted[i]!, i);
    if (s) spots.push(s);
  }

  const titleStr = source.titleKo?.trim() || "Haru Route";
  const title: LocaleMap = { ko: titleStr, en: titleStr, th: titleStr, vi: titleStr };
  const total =
    source.routeJourney.metadata?.estimated_total_duration_minutes ??
    spots.reduce((m, s) => m + s.stay_min + (s.move_from_prev_min ?? 0), 0);

  const haru: HaruRoute = {
    id: routeId,
    title,
    guardian: guardianForAuthor(source.authorUserId),
    total_duration_min: Math.max(total, 1),
    estimated_cost_min_krw: null,
    estimated_cost_max_krw: null,
    recommended_time_of_day: (() => {
      const t = source.routeJourney.metadata?.recommended_time_of_day;
      if (t === "morning" || t === "afternoon" || t === "evening" || t === "flexible") return t;
      if (t === "night") return "evening";
      return null;
    })(),
    cover_image_url: source.coverImageUrl ?? null,
    spots,
  };

  return {
    haru,
    routeType: "sample",
    status: routeStatusFromPost(source.postStatus),
    directionsMeta: null,
  };
}
