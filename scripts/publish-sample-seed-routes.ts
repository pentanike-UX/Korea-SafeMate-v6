/**
 * 시드 샘플 루트 중 approved/published 포스트에 연결된 draft 루트를 public으로 승격.
 *
 *   node --env-file=.env.local ./node_modules/tsx/dist/cli.mjs scripts/publish-sample-seed-routes.ts
 */
import { createClient } from "@supabase/supabase-js";
import { buildSampleContentSeedPlan } from "../src/lib/seed/build-sample-seed-plan";
import { routeIdForPostId } from "../src/lib/routes/related-route-id";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing env");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const plan = buildSampleContentSeedPlan();
  const publicRouteIds = plan.posts
    .filter((p) => {
      const status = (p.post_row as Record<string, unknown>).status;
      return status === "approved" || status === "published";
    })
    .map((p) => routeIdForPostId(p.id));

  const { data, error } = await sb
    .from("routes")
    .update({ status: "public" })
    .in("id", publicRouteIds)
    .eq("route_type", "sample")
    .select("id");

  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`[publish-sample-seed-routes] updated ${data?.length ?? 0} routes to public`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
