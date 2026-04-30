import { z } from "zod";

export const SPOT_CATEGORIES = [
  "food",
  "cafe",
  "attraction",
  "shopping",
  "nightlife",
  "nature",
  "activity",
] as const;

export const SPOT_IMAGE_TYPES = ["hero", "practical", "walking", "timing", "night"] as const;

export const SPOT_IMAGE_SOURCES = [
  "naver",
  "guardian_upload",
  "admin_upload",
  "stock",
] as const;

export const IMAGE_STRATEGIES = ["practical", "aesthetic", "mixed"] as const;

// ── Naver place to spot_catalog ───────────────────────────────────────────────

export const createSpotFromNaverSchema = z.object({
  /** 정제된 장소명 (HTML 태그 제거 후) */
  name_ko: z.string().min(1).max(120),
  name_en: z.string().max(120).optional(),
  address_ko: z.string().max(200).optional(),
  district: z.string().max(60).optional(),
  lat: z.number().min(33).max(39),
  lng: z.number().min(124).max(132),
  category: z.enum(SPOT_CATEGORIES),
  subcategory: z.string().max(80).optional(),
  naver_place_id: z.string().max(40).optional(),
  region_tags: z.array(z.string()).default([]),
  /** Naver API raw response — 원본 보존 */
  naver_data: z.record(z.string(), z.unknown()).optional(),
  internal_note: z.string().max(500).optional(),
});

export type CreateSpotFromNaverInput = z.infer<typeof createSpotFromNaverSchema>;

// ── Spot image management ─────────────────────────────────────────────────────

export const addSpotImageSchema = z.object({
  url: z.string().min(1).max(1000),
  image_type: z.enum(SPOT_IMAGE_TYPES).default("hero"),
  is_primary: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
  source: z.enum(SPOT_IMAGE_SOURCES).default("admin_upload"),
  caption_ko: z.string().max(200).optional(),
  caption_en: z.string().max(200).optional(),
  is_stored: z.boolean().default(false),
});

export type AddSpotImageInput = z.infer<typeof addSpotImageSchema>;

export const updateSpotImageSchema = addSpotImageSchema.partial().omit({ url: true });

export type UpdateSpotImageInput = z.infer<typeof updateSpotImageSchema>;

// ── Spot search query ─────────────────────────────────────────────────────────

export const naverSearchQuerySchema = z.object({
  query: z.string().min(1).max(80),
  display: z.coerce.number().int().min(1).max(5).default(5),
});

export type NaverSearchQuery = z.infer<typeof naverSearchQuerySchema>;
