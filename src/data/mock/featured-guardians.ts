import type { FeaturedGuardian } from "@/types/domain";
import { GUARDIAN_SEED_ROWS } from "./guardians-seed";

/** 시드에서 `featured: true`인 가디언만 홈·추천에 사용합니다. */
export const mockFeaturedGuardians: FeaturedGuardian[] = GUARDIAN_SEED_ROWS.filter((r) => r.featured).map((r, i) => ({
  guardian_user_id: r.id,
  tagline: r.headline,
  priority: 100 - i,
  active: true,
}));
