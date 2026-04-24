import { mockFeaturedGuardians } from "@/data/mock";
import { listLaunchReadyGuardians, type PublicGuardian } from "@/lib/guardian-public";
import type { LaunchAreaSlug } from "@/types/launch-area";

export function orderedHomeGuardians(): PublicGuardian[] {
  const launch = listLaunchReadyGuardians();
  const featuredOrder = mockFeaturedGuardians.filter((f) => f.active).map((f) => f.guardian_user_id);
  const picked = featuredOrder
    .map((id) => launch.find((g) => g.user_id === id))
    .filter(Boolean) as PublicGuardian[];
  const rest = launch.filter((g) => !featuredOrder.includes(g.user_id));
  return [...picked, ...rest];
}

/** Picks up to `limit` launch-ready guardians matching Quick Start area/theme, then backfills from the home default order. */
export function pickHomeRecommendedGuardians(
  area: LaunchAreaSlug | null,
  theme: string | null,
  limit = 3,
): PublicGuardian[] {
  let pool = listLaunchReadyGuardians();
  if (area) {
    pool = pool.filter((g) => g.launch_area_slug === area);
  }
  if (theme) {
    pool = pool.filter((g) => g.theme_slugs.includes(theme));
  }
  pool.sort((a, b) => (b.avg_traveler_rating ?? 0) - (a.avg_traveler_rating ?? 0));

  const seen = new Set<string>();
  const result: PublicGuardian[] = [];
  for (const g of pool) {
    if (result.length >= limit) break;
    result.push(g);
    seen.add(g.user_id);
  }
  if (result.length < limit) {
    for (const g of orderedHomeGuardians()) {
      if (result.length >= limit) break;
      if (seen.has(g.user_id)) continue;
      result.push(g);
      seen.add(g.user_id);
    }
  }
  return result.slice(0, limit);
}
