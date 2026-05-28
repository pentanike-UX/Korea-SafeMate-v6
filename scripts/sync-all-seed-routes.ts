/**
 * 모든 시드 포스트의 `route_journey` → routes / route_spots / spot_catalog 일괄 동기화.
 *
 * Usage:
 *   pnpm routes:sync-seed -- --dry-run
 *   pnpm routes:sync-seed -- --apply
 */
import { createClient } from "@supabase/supabase-js";
import { buildSampleContentSeedPlan } from "../src/lib/seed/build-sample-seed-plan";
import { routeIdForPostId } from "../src/lib/routes/related-route-id";
import { syncAllSeedRoutesFromPosts } from "../src/lib/routes/ensure-route-from-post.server";

async function main() {
  const dry = process.argv.includes("--dry-run") || !process.argv.includes("--apply");
  const plan = buildSampleContentSeedPlan();
  const withJourney = plan.posts.filter((p) => {
    const j = (p.post_row as Record<string, unknown>).route_journey;
    return Boolean(j && typeof j === "object" && Array.isArray((j as { spots?: unknown }).spots));
  });

  console.log(
    JSON.stringify(
      {
        dry_run: dry,
        posts_with_journey: withJourney.length,
        sample_route_ids: withJourney.slice(0, 3).map((p) => routeIdForPostId(p.id)),
      },
      null,
      2,
    ),
  );

  if (dry) {
    console.log("\n[routes:sync-seed] Dry run. Pass --apply to upsert routes.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await syncAllSeedRoutesFromPosts(sb);
  console.log("[routes:sync-seed] Done:", result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
