import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppLocale, HaruRoute, HaruSpot, LocaleMap, MoveMethod } from "@/types/haru";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidRouteId(routeId: string): boolean {
  return UUID_RE.test(routeId.trim());
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍽️",
  cafe: "☕",
  attraction: "⭐",
  shopping: "🛍️",
  nightlife: "🌙",
  nature: "🌿",
  activity: "🎯",
};

function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? "📍";
}

type SpotCatalogRow = {
  id: string;
  name_ko: string;
  name_en: string | null;
  name_th: string | null;
  name_vi: string | null;
  address_ko: string | null;
  address_en: string | null;
  lat: string | number;
  lng: string | number;
  category: string;
  images: string[] | null;
};

type RouteSpotRow = {
  id: string;
  sort_order: number;
  stay_min: number;
  guardian_note_ko: string | null;
  guardian_note_en: string | null;
  guardian_note_th: string | null;
  guardian_note_vi: string | null;
  move_from_prev_method: string | null;
  move_from_prev_min: number | null;
  spot_catalog: SpotCatalogRow | SpotCatalogRow[] | null;
};

type RouteRow = {
  id: string;
  guardian_user_id: string;
  title_ko: string | null;
  title_en: string | null;
  title_th: string | null;
  title_vi: string | null;
  total_duration_min: number | null;
  estimated_cost_min_krw: number | null;
  estimated_cost_max_krw: number | null;
  cover_image_url: string | null;
  status: string;
  route_type: string;
  route_spots: RouteSpotRow[] | null;
};

function asCatalog(row: RouteSpotRow["spot_catalog"]): SpotCatalogRow | null {
  if (!row) return null;
  return Array.isArray(row) ? row[0] ?? null : row;
}

function toNum(v: string | number): number {
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function noteMap(
  ko: string | null,
  en: string | null,
  th: string | null,
  vi: string | null,
): LocaleMap {
  return { ko: ko ?? "", en: en ?? "", th: th ?? "", vi: vi ?? "" };
}

function nameMap(c: SpotCatalogRow): LocaleMap {
  return {
    ko: c.name_ko,
    en: c.name_en,
    th: c.name_th,
    vi: c.name_vi,
  };
}

function mapSpotRow(row: RouteSpotRow, idx: number): HaruSpot | null {
  const cat = asCatalog(row.spot_catalog);
  if (!cat) return null;
  const method = row.move_from_prev_method as MoveMethod | null;
  const validMethod =
    method === "walk" || method === "subway" || method === "taxi" ? method : null;

  return {
    id: row.id,
    order: row.sort_order ?? idx + 1,
    catalog: {
      name: nameMap(cat),
      category: cat.category,
      category_emoji: categoryEmoji(cat.category),
      image_url: cat.images?.[0] ?? null,
      address: cat.address_en ?? cat.address_ko ?? null,
      lat: toNum(cat.lat),
      lng: toNum(cat.lng),
    },
    stay_min: row.stay_min,
    guardian_note: noteMap(
      row.guardian_note_ko,
      row.guardian_note_en,
      row.guardian_note_th,
      row.guardian_note_vi,
    ),
    move_from_prev_method: idx === 0 ? null : validMethod,
    move_from_prev_min: idx === 0 ? null : row.move_from_prev_min,
    featured: idx === 0,
  };
}

function sumDurationFromSpots(spots: HaruSpot[]): number {
  let m = 0;
  for (const s of spots) {
    m += s.stay_min;
    if (s.move_from_prev_min) m += s.move_from_prev_min;
  }
  return Math.max(m, 1);
}

export function mapRouteRowToHaruRoute(
  row: RouteRow,
  guardianDisplayName: string,
  guardianPhotoUrl: string | null,
): HaruRoute {
  const rawSpots = [...(row.route_spots ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const spots: HaruSpot[] = [];
  for (let i = 0; i < rawSpots.length; i++) {
    const s = mapSpotRow(rawSpots[i], i);
    if (s) spots.push(s);
  }

  const title: LocaleMap = {
    ko: row.title_ko,
    en: row.title_en,
    th: row.title_th,
    vi: row.title_vi,
  };

  const total =
    row.total_duration_min != null && row.total_duration_min > 0
      ? row.total_duration_min
      : sumDurationFromSpots(spots);

  return {
    id: row.id,
    title,
    guardian: {
      display_name: guardianDisplayName,
      photo_url: guardianPhotoUrl,
    },
    total_duration_min: total,
    estimated_cost_min_krw: row.estimated_cost_min_krw,
    estimated_cost_max_krw: row.estimated_cost_max_krw,
    cover_image_url: row.cover_image_url,
    spots,
  };
}

export type TravelerRouteListItem = {
  id: string;
  title_ko: string | null;
  title_en: string | null;
  title_th: string | null;
  title_vi: string | null;
  cover_image_url: string | null;
  status: string;
  updated_at: string;
  total_duration_min: number | null;
};

/** RLS: 커스텀 루트 중 본인 예약(`order_id` = `bookings.id`)에 연결된 행만 반환. */
export async function listTravelerPurchasedRoutes(
  supabase: SupabaseClient,
): Promise<TravelerRouteListItem[]> {
  const { data, error } = await supabase
    .from("routes")
    .select("id, title_ko, title_en, title_th, title_vi, cover_image_url, status, updated_at, total_duration_min")
    .eq("route_type", "custom")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data as TravelerRouteListItem[];
}

export type FetchedHaruBundle = {
  haru: HaruRoute;
  routeType: "sample" | "custom";
  /** DB `routes.status` */
  status: string;
};

export async function fetchHaruRouteFromSupabase(
  supabase: SupabaseClient,
  routeId: string,
): Promise<FetchedHaruBundle | null> {
  if (!isUuidRouteId(routeId)) return null;

  const { data, error } = await supabase
    .from("routes")
    .select(
      `id, guardian_user_id, title_ko, title_en, title_th, title_vi,
       total_duration_min, estimated_cost_min_krw, estimated_cost_max_krw,
       cover_image_url, status, route_type,
       route_spots (
         id, sort_order, stay_min,
         guardian_note_ko, guardian_note_en, guardian_note_th, guardian_note_vi,
         move_from_prev_method, move_from_prev_min,
         spot_catalog (
           id, name_ko, name_en, name_th, name_vi,
           address_ko, address_en, lat, lng, category, images
         )
       )`,
    )
    .eq("id", routeId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as RouteRow;
  if (row.route_type !== "sample" && row.route_type !== "custom") return null;

  let guardianName = "Guardian";
  let guardianPhoto: string | null = null;
  const { data: gp } = await supabase
    .from("guardian_profiles")
    .select("display_name, photo_url, avatar_image_url")
    .eq("user_id", row.guardian_user_id)
    .maybeSingle();
  if (gp) {
    const g = gp as { display_name?: string; photo_url?: string | null; avatar_image_url?: string | null };
    if (g.display_name?.trim()) guardianName = g.display_name.trim();
    guardianPhoto = g.photo_url ?? g.avatar_image_url ?? null;
  }

  const haru = mapRouteRowToHaruRoute(row, guardianName, guardianPhoto);
  return {
    haru,
    routeType: row.route_type as "sample" | "custom",
    status: row.status,
  };
}
