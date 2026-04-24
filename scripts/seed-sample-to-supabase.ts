/**
 * Import plan from `buildSampleContentSeedPlan()` into Supabase (service role).
 *
 * Prerequisites:
 * - Apply migrations including `is_sample` / `seed_*_key` columns.
 * - `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
 * - `public.users` rows for each deterministic guardian UUID (same as plan `user_id`),
 *   typically created via Supabase Auth Admin + `public.users` insert (FK to auth.users).
 *
 * Usage:
 *   pnpm seed:sample -- --dry-run
 *   pnpm seed:sample -- --apply
 *
 * After DB is populated: set `SAFE_MERGE_SEED_MOCK=0` on the server to stop merging in-memory mock.
 */
import { createClient } from "@supabase/supabase-js";
import { buildSampleContentSeedPlan } from "../src/lib/seed/build-sample-seed-plan";

async function main() {
  const dry = process.argv.includes("--dry-run") || !process.argv.includes("--apply");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const plan = buildSampleContentSeedPlan();

  console.log(
    JSON.stringify(
      {
        dry_run: dry,
        guardian_count: plan.guardians.length,
        post_count: plan.posts.length,
        sample_guardian_user_ids: plan.guardians.slice(0, 3).map((g) => g.user_id),
        sample_post_ids: plan.posts.slice(0, 3).map((p) => p.id),
      },
      null,
      2,
    ),
  );

  if (dry) {
    console.log("\n[seed-sample] Dry run only. Pass --apply to upsert (requires env + users rows).");
    return;
  }

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: regions, error: re } = await sb.from("regions").select("id, slug");
  if (re || !regions?.length) {
    console.error("[seed-sample] regions:", re?.message ?? "empty");
    process.exit(1);
  }
  const regionBySlug = new Map(regions.map((r) => [r.slug as string, r.id as string]));

  const { data: cats, error: ce } = await sb.from("content_categories").select("id, slug");
  if (ce || !cats?.length) {
    console.error("[seed-sample] content_categories:", ce?.message ?? "empty");
    process.exit(1);
  }
  const catBySlug = new Map(cats.map((c) => [c.slug as string, c.id as string]));

  const guardianIds = plan.guardians.map((g) => g.user_id);
  const { data: existingUsers, error: ue } = await sb.from("users").select("id").in("id", guardianIds);
  if (ue) {
    console.error("[seed-sample] users check:", ue.message);
    process.exit(1);
  }
  const haveUsers = new Set((existingUsers ?? []).map((u) => u.id as string));
  const missingUsers = guardianIds.filter((id) => !haveUsers.has(id));
  if (missingUsers.length > 0) {
    console.warn(
      `[seed-sample] ${missingUsers.length} guardian user_id(s) missing from public.users — skip guardian_profiles until Auth+users are created.`,
    );
    console.warn("Missing (example):", missingUsers.slice(0, 5));
  }

  for (const g of plan.guardians) {
    if (!haveUsers.has(g.user_id)) continue;
    const rid = regionBySlug.get(g.primary_region_slug) ?? null;
    const profile = { ...g.profile_row, primary_region_id: rid };
    const { error } = await sb.from("guardian_profiles").upsert(profile, { onConflict: "user_id" });
    if (error) {
      console.error("[seed-sample] guardian_profiles", g.seed_guardian_key, error.message);
      process.exit(1);
    }
    if (g.language_rows.length > 0) {
      await sb.from("guardian_languages").delete().eq("guardian_user_id", g.user_id);
      const { error: le } = await sb.from("guardian_languages").insert(g.language_rows);
      if (le) {
        console.error("[seed-sample] guardian_languages", g.seed_guardian_key, le.message);
        process.exit(1);
      }
    }
  }

  let postsOk = 0;
  for (const p of plan.posts) {
    if (!haveUsers.has(p.author_user_id)) {
      console.warn("[seed-sample] skip post (author user missing):", p.seed_content_key);
      continue;
    }
    const regionId = regionBySlug.get(p.region_slug);
    const catId = catBySlug.get(p.category_slug);
    if (!regionId || !catId) {
      console.warn("[seed-sample] skip post (unknown slug):", p.seed_content_key, p.region_slug, p.category_slug);
      continue;
    }
    const row = {
      ...p.post_row,
      region_id: regionId,
      category_id: catId,
    };
    const { error } = await sb.from("content_posts").upsert(row, { onConflict: "id" });
    if (error) {
      console.error("[seed-sample] content_posts", p.seed_content_key, error.message);
      process.exit(1);
    }
    postsOk += 1;
  }

  console.log(`[seed-sample] Upserted guardians (with users): ${guardianIds.length - missingUsers.length}, posts: ${postsOk}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
