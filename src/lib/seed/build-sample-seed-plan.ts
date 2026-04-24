/**
 * Builds a JSON-serializable plan to import `mockContentPosts` / `mockGuardians` into Supabase.
 * Run `pnpm seed:sample -- --dry-run` or apply rows via `scripts/seed-sample-to-supabase.ts`.
 *
 * Prerequisites: `auth.users` + `public.users` rows for each `guardianPlan.user_id` (same UUID as here).
 */
import { mockContentPosts } from "@/data/mock/content-posts";
import { mockGuardians } from "@/data/mock/guardians";
import {
  contentPostToDbScalars,
  guardianLanguagesToDbRows,
  guardianProfileToDbRow,
  resolveGuardianUserIdForSeed,
  resolvePostIdForSeed,
  seedContentKeyFromPost,
  seedGuardianKeyFromString,
} from "@/lib/seed/map-seed-to-db-rows";

export type SampleGuardianSeedPlan = {
  seed_guardian_key: string;
  user_id: string;
  primary_region_slug: string;
  profile_row: Record<string, unknown>;
  language_rows: ReturnType<typeof guardianLanguagesToDbRows>;
};

export type SamplePostSeedPlan = {
  seed_content_key: string;
  id: string;
  author_user_id: string;
  region_slug: string;
  category_slug: string;
  post_row: Record<string, unknown>;
};

export type SampleContentSeedPlan = {
  version: 1;
  guardians: SampleGuardianSeedPlan[];
  posts: SamplePostSeedPlan[];
};

export function buildSampleContentSeedPlan(): SampleContentSeedPlan {
  const guardians: SampleGuardianSeedPlan[] = mockGuardians.map((g) => {
    const seedKey = seedGuardianKeyFromString(g.user_id) ?? g.user_id;
    const user_id = resolveGuardianUserIdForSeed(g.user_id);
    const profile_row = guardianProfileToDbRow(g, {
      user_id,
      primary_region_id: null,
      is_sample: true,
      seed_guardian_key: /^mg\d{2}$/i.test(seedKey) ? seedKey.toLowerCase() : seedKey,
    });
    return {
      seed_guardian_key: /^mg\d{2}$/i.test(seedKey) ? seedKey.toLowerCase() : seedKey,
      user_id,
      primary_region_slug: g.primary_region_slug,
      profile_row,
      language_rows: guardianLanguagesToDbRows(g, user_id),
    };
  });

  const posts: SamplePostSeedPlan[] = mockContentPosts.map((p) => {
    const seedKey = seedContentKeyFromPost(p);
    const id = resolvePostIdForSeed(p);
    const author_user_id = resolveGuardianUserIdForSeed(p.author_user_id);
    const post_row = {
      ...contentPostToDbScalars(p),
      id,
      author_user_id,
      is_sample: true,
      seed_content_key: seedKey,
    };
    return {
      seed_content_key: seedKey,
      id,
      author_user_id,
      region_slug: p.region_slug,
      category_slug: p.category_slug,
      post_row,
    };
  });

  return { version: 1, guardians, posts };
}
