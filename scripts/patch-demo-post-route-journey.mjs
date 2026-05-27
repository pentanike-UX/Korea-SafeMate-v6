#!/usr/bin/env node
/**
 * 데모 하루웨이 포스트 1건에 route_journey를 채워 루트형 상세 UI로 전환.
 * (related_route_id만 있고 route_journey가 null이면 아티클 레이아웃만 나옴)
 *
 * node --env-file=.env.local scripts/patch-demo-post-route-journey.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { DEMO_ROUTE_JOURNEY } from "./demo-route-journey-data.mjs";

const POST_ID = "9396611c-561c-5736-befd-baba8d3e3fd8";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await sb
  .from("content_posts")
  .update({
    route_journey: DEMO_ROUTE_JOURNEY,
    post_format: "route",
    status: "approved",
    updated_at: new Date().toISOString(),
  })
  .eq("id", POST_ID)
  .select("id, title, related_route_id")
  .maybeSingle();

if (error) {
  console.error("✗ update failed:", error.message);
  process.exit(1);
}
if (!data) {
  console.error("✗ post not found:", POST_ID);
  process.exit(1);
}

console.log("✓ Patched:", data.id, data.title);
console.log("  related_route_id:", data.related_route_id);
console.log("  spots:", DEMO_ROUTE_JOURNEY.spots.length);
console.log("\nRefresh:", `${url.replace(/\/$/, "")}/ko/posts/${POST_ID}`);
