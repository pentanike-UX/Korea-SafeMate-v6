import type { GuardianSeedBundle } from "./guardian-seed-types";
import { buildGuardianSeedPosts } from "./guardian-seed-posts";
import { buildGuardianSeedRecords, GUARDIAN_SEED_ROWS } from "./guardians-seed";

let cachedBundle: GuardianSeedBundle | null = null;

/**
 * 가디언 시드 번들 — 프로필·포인트·포스트가 같은 `user_id`로 연결됩니다.
 * Traveler/Match 확장 시 `GuardianSeedRecord`에 `traveler_user_ids` 등을 옵션 필드로 추가하고,
 * 이 함수에서 `bookings`/`matches` 시드를 같은 ID로 합치면 됩니다.
 */
export function getGuardianSeedBundle(): GuardianSeedBundle {
  if (cachedBundle) return cachedBundle;
  const guardians = buildGuardianSeedRecords();
  const posts = buildGuardianSeedPosts(GUARDIAN_SEED_ROWS);
  const pointsByAuthorId: Record<string, number> = {};
  for (const row of GUARDIAN_SEED_ROWS) {
    pointsByAuthorId[row.id] = row.seed_points_available;
  }
  cachedBundle = { guardians, posts, pointsByAuthorId };
  return cachedBundle;
}
