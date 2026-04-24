/**
 * Seed lookup/reference tables required for sample content import:
 * - public.regions
 * - public.content_categories
 * - public.service_types
 *
 * Usage:
 *   npm run seed:reference -- --dry-run
 *   npm run seed:reference -- --apply
 */
import { createClient } from "@supabase/supabase-js";
import { mockRegions } from "../src/data/mock/regions";
import { mockContentCategories } from "../src/data/mock/content-categories";
import { mockServiceTypes } from "../src/data/mock/service-types";

function isApplyMode(argv: string[]): boolean {
  return argv.includes("--apply");
}

function isDryRun(argv: string[]): boolean {
  return argv.includes("--dry-run") || !isApplyMode(argv);
}

function dbPhase(n: unknown): "phase_1" | "phase_2" {
  return n === 2 ? "phase_2" : "phase_1";
}

async function main() {
  const dryRun = isDryRun(process.argv);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const regionRows = mockRegions.map((r) => ({
    slug: r.slug,
    name: r.name,
    name_ko: r.name_ko,
    phase: dbPhase((r as any).phase),
    short_description: (r as any).short_description ?? null,
    detail_blurb: (r as any).detail_blurb ?? null,
    sort_order: 0,
  }));

  const categoryRows = mockContentCategories.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description ?? null,
  }));

  const serviceRows = mockServiceTypes.map((s) => ({
    code: s.code,
    name: s.name,
    short_description: s.short_description,
    duration_hours: s.duration_hours,
    base_price_krw: s.base_price_krw,
    active: true,
  }));

  console.log(
    JSON.stringify(
      {
        dry_run: dryRun,
        regions: { count: regionRows.length, slugs: regionRows.map((r) => r.slug) },
        content_categories: {
          count: categoryRows.length,
          slugs: categoryRows.map((c) => c.slug),
        },
        service_types: { count: serviceRows.length, codes: serviceRows.map((s) => s.code) },
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log("\n[seed-reference] Dry run only. Pass --apply to upsert rows.");
    return;
  }

  const { error: re } = await sb.from("regions").upsert(regionRows, { onConflict: "slug" });
  if (re) {
    console.error("[seed-reference] regions upsert failed:", re.message);
    process.exit(1);
  }

  const { error: ce } = await sb.from("content_categories").upsert(categoryRows, { onConflict: "slug" });
  if (ce) {
    console.error("[seed-reference] content_categories upsert failed:", ce.message);
    process.exit(1);
  }

  const { error: se } = await sb.from("service_types").upsert(serviceRows, { onConflict: "code" });
  if (se) {
    console.error("[seed-reference] service_types upsert failed:", se.message);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        applied: true,
        upserted: {
          regions: regionRows.length,
          content_categories: categoryRows.length,
          service_types: serviceRows.length,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

