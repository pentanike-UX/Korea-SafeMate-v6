import type { ContentPost, GuardianApprovalStatus, GuardianProfile, GuardianTier } from "@/types/domain";

/** Product IA — separate from DB `approval_status` / `profile_status` naming. */
export type GuardianLifecycleStatus = "draft" | "submitted" | "approved" | "rejected" | "suspended";

/** Display tier for ops / marketing (maps to `GuardianTier` ladder). */
export type ProductGuardianTier = "Starter" | "Active" | "Pro" | "Elite";

/**
 * Extended mock row: links email, lifecycle, product tier, and point seed to `GuardianProfile`.
 * Traveler / match extensions: add `traveler_user_ids?: string[]`, `match_ids?: string[]` on future seeds.
 */
export interface GuardianSeedRecord extends GuardianProfile {
  email: string;
  lifecycle_status: GuardianLifecycleStatus;
  product_tier: ProductGuardianTier;
  /** Ledger-style available balance for UI demos (not persisted until wired). */
  seed_points_available: number;
  /** Total approved posts in this bundle (denormalized; equals count of approved posts in seed list). */
  seed_approved_post_count: number;
}

export interface GuardianSeedBundle {
  guardians: GuardianSeedRecord[];
  posts: ContentPost[];
  /** author_user_id → available points */
  pointsByAuthorId: Record<string, number>;
}

/**
 * `public/mock/post-covers/`에 에셋을 추가한 뒤 `true`로 바꾸면 로컬 커버를 사용합니다.
 * 없으면 Unsplash URL로 폴백합니다.
 */
export const GUARDIAN_SEED_USE_LOCAL_POST_COVERS = false;

/** 내부 시드 행 — `guardians-seed.ts`에서 프로필·포스트를 함께 생성합니다. */
export interface GuardianSeedRow {
  id: string;
  email: string;
  display_name: string;
  headline: string;
  bio: string;
  lifecycle_status: GuardianLifecycleStatus;
  product_tier: ProductGuardianTier;
  primary_region_slug: string;
  years_in_seoul: number;
  /** 1–15 → `/mock/profiles/profile_XX.jpg` */
  profile_image_index: number;
  seed_points_available: number;
  featured: boolean;
  matching_enabled: boolean;
  avg_traveler_rating: number | null;
  expertise_tags: string[];
  posts_approved_last_30d: number;
  posts_approved_last_7d: number;
  influencer_seed: boolean;
  languages: Array<{ code: string; proficiency: "basic" | "conversational" | "fluent" | "native" }>;
  posts_plan: {
    approved: number;
    pending: number;
    draft: number;
    rejected: number;
  };
}
