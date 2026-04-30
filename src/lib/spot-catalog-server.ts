/**
 * spot_catalog + spot_images Supabase 서버 쿼리 모음.
 * Server Component / Route Handler 전용 (클라이언트에서 import 금지).
 *
 * 원격 DB에 마이그레이션 미적용 시 테이블이 없으면 빈 결과를 반환합니다.
 * 적용: `supabase db push` 또는 SQL 에디터에서 `supabase/migrations/20260401000008_create_spot_catalog.sql` 부터 순서대로.
 */
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { isSupabaseTableMissingError } from "@/lib/supabase-table-errors";
import type { CatalogImageMap, SpotCatalogEntry, SpotImage, SpotImageType } from "@/types/domain";

function logSpotCatalogError(context: string, error: { message?: string; code?: string }) {
  if (isSupabaseTableMissingError(error)) {
    console.warn(
      `[spot-catalog] ${context}: DB에 spot_catalog / spot_images 가 없습니다. ` +
        `로컬 저장소의 supabase/migrations 를 원격 Supabase에 적용하세요. (${error.message})`,
    );
    return;
  }
  console.error(`[spot-catalog] ${context}:`, error.message);
}

// ─── 장소 검색 / CRUD ─────────────────────────────────────────────────────────

export async function listSpotCatalog(opts?: {
  limit?: number;
  offset?: number;
  category?: string;
  verified?: boolean;
}): Promise<SpotCatalogEntry[]> {
  const sb = createServiceRoleSupabase();
  if (!sb) return [];

  let q = sb
    .from("spot_catalog")
    .select(
      "id, name_ko, name_en, address_ko, district, lat, lng, category, subcategory, region_tags, naver_place_id, kakaomap_id, image_strategy, primary_image_url, is_verified, is_active, source, created_at",
    )
    .order("created_at", { ascending: false });

  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.verified !== undefined) q = q.eq("is_verified", opts.verified);
  if (opts?.limit) q = q.limit(opts.limit);
  if (opts?.offset) q = q.range(opts.offset, (opts.offset ?? 0) + (opts.limit ?? 20) - 1);

  const { data, error } = await q;
  if (error) {
    logSpotCatalogError("listSpotCatalog", error);
    return [];
  }
  return (data ?? []) as SpotCatalogEntry[];
}

export async function getSpotCatalogById(spotId: string): Promise<SpotCatalogEntry | null> {
  const sb = createServiceRoleSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from("spot_catalog")
    .select("*")
    .eq("id", spotId)
    .maybeSingle();

  if (error) {
    logSpotCatalogError("getSpotCatalogById", error);
    return null;
  }
  if (!data) return null;
  return data as SpotCatalogEntry;
}

// ─── 이미지 조회 ──────────────────────────────────────────────────────────────

export async function listSpotImages(spotCatalogId: string): Promise<SpotImage[]> {
  const sb = createServiceRoleSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("spot_images")
    .select("*")
    .eq("spot_catalog_id", spotCatalogId)
    .order("image_type")
    .order("sort_order");

  if (error) {
    logSpotCatalogError("listSpotImages", error);
    return [];
  }
  return (data ?? []) as SpotImage[];
}

/** 특정 타입의 대표 이미지 URL 반환. 없으면 null. */
export async function getPrimarySpotImageUrl(
  spotCatalogId: string,
  imageType: SpotImageType = "hero",
): Promise<string | null> {
  const sb = createServiceRoleSupabase();
  if (!sb) return null;

  const { data } = await sb
    .from("spot_images")
    .select("url")
    .eq("spot_catalog_id", spotCatalogId)
    .eq("image_type", imageType)
    .eq("is_primary", true)
    .maybeSingle();

  return data?.url ?? null;
}

/**
 * 하루웨이(ContentPost) 내 여러 스팟의 catalog 이미지를 일괄 조회.
 * spot_catalog_id 가 있는 스팟에만 동작.
 * Server Component에서 한 번에 pre-fetch → EditorialSpotRow로 전달.
 */
export async function buildCatalogImageMap(
  spotCatalogIds: string[],
): Promise<CatalogImageMap> {
  const map: CatalogImageMap = new Map();
  if (spotCatalogIds.length === 0) return map;

  const sb = createServiceRoleSupabase();
  if (!sb) return map;

  const { data, error } = await sb
    .from("spot_images")
    .select("*")
    .in("spot_catalog_id", spotCatalogIds)
    .order("sort_order");

  if (error) {
    logSpotCatalogError("buildCatalogImageMap", error);
    return map;
  }

  for (const img of (data ?? []) as SpotImage[]) {
    const arr = map.get(img.spot_catalog_id) ?? [];
    arr.push(img);
    map.set(img.spot_catalog_id, arr);
  }

  return map;
}

// ─── 이미지 리졸버 헬퍼 ──────────────────────────────────────────────────────

/**
 * CatalogImageMap에서 지정 타입 우선 → hero 폴백으로 이미지 URL을 반환.
 * 없으면 null 반환 → 기존 buildLocalPostVisualPlan 로직으로 낙하.
 */
export function resolveCatalogImageUrl(
  catalogImages: CatalogImageMap,
  spotCatalogId: string,
  preferType: SpotImageType = "hero",
): string | null {
  const images = catalogImages.get(spotCatalogId);
  if (!images || images.length === 0) return null;

  // 요청 타입의 is_primary 이미지 우선
  const primary = images.find((i) => i.image_type === preferType && i.is_primary);
  if (primary) return primary.url;

  // 요청 타입의 첫 번째 이미지
  const sameType = images.find((i) => i.image_type === preferType);
  if (sameType) return sameType.url;

  // hero is_primary 폴백
  const heroPrimary = images.find((i) => i.image_type === "hero" && i.is_primary);
  if (heroPrimary) return heroPrimary.url;

  // 아무 이미지나
  return images[0]?.url ?? null;
}
