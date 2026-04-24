/**
 * Bootstrap sample guardian users (mg01..mg15) into:
 * - auth.users (via Admin API)
 * - public.users (FK to auth.users)
 *
 * Goal: make `seed:sample --apply` possible without finishing full auth/login UX.
 *
 * Usage:
 *   npm run seed:users -- --dry-run
 *   npm run seed:users -- --apply
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { GUARDIAN_SEED_ROWS } from "../src/data/mock/guardians-seed";
import { seedGuardianUserUuid } from "../src/lib/seed/deterministic-uuid";

type ResultRow = {
  seed_key: string;
  id: string;
  email: string;
  auth: "created" | "updated" | "skipped";
  public_user: "upserted" | "skipped";
};

function isApplyMode(argv: string[]): boolean {
  return argv.includes("--apply");
}

function isDryRun(argv: string[]): boolean {
  return argv.includes("--dry-run") || !isApplyMode(argv);
}

function buildPassword(seedKey: string): string {
  // Not used for login UX; only to satisfy auth user creation reliably.
  // Deterministic-ish prefix + randomness to avoid leaking a predictable password pattern.
  return `Seed!${seedKey}-${randomBytes(16).toString("hex")}`;
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

  const targets = GUARDIAN_SEED_ROWS.map((r) => ({
    seed_key: r.id.trim(),
    id: seedGuardianUserUuid(r.id.trim()),
    email: r.email.trim(),
  }));

  console.log(
    JSON.stringify(
      {
        dry_run: dryRun,
        guardian_count: targets.length,
        sample: targets.slice(0, 5),
      },
      null,
      2,
    ),
  );

  const results: ResultRow[] = [];
  let authCreated = 0;
  let authUpdated = 0;
  let authSkipped = 0;
  let publicUpserted = 0;
  let publicSkipped = 0;

  for (const t of targets) {
    if (dryRun) {
      results.push({ seed_key: t.seed_key, id: t.id, email: t.email, auth: "skipped", public_user: "skipped" });
      authSkipped += 1;
      publicSkipped += 1;
      continue;
    }

    // 1) auth.users: create (idempotent via get/update fallback)
    let authStatus: ResultRow["auth"] = "skipped";
    const existing = await sb.auth.admin.getUserById(t.id);
    if (!existing.error && existing.data?.user) {
      const curEmail = existing.data.user.email ?? "";
      if (curEmail.toLowerCase() !== t.email.toLowerCase()) {
        const upd = await sb.auth.admin.updateUserById(t.id, {
          email: t.email,
          email_confirm: true,
        });
        if (upd.error) {
          console.error("[seed:users] auth update failed:", t.seed_key, upd.error.message);
          process.exit(1);
        }
        authStatus = "updated";
        authUpdated += 1;
      } else {
        authStatus = "skipped";
        authSkipped += 1;
      }
    } else {
      const created = await sb.auth.admin.createUser({
        id: t.id,
        email: t.email,
        email_confirm: true,
        password: buildPassword(t.seed_key),
      });
      if (created.error) {
        // If create fails due to existence, re-check and treat as skipped.
        const recheck = await sb.auth.admin.getUserById(t.id);
        if (!recheck.error && recheck.data?.user) {
          authStatus = "skipped";
          authSkipped += 1;
        } else {
          console.error("[seed:users] auth create failed:", t.seed_key, created.error.message);
          process.exit(1);
        }
      } else {
        authStatus = "created";
        authCreated += 1;
      }
    }

    // 2) public.users: upsert id/email (FK now satisfied)
    const { error: ue } = await sb
      .from("users")
      .upsert(
        {
          id: t.id,
          email: t.email,
          // Intentional explicit roles for sample guardians (align with app assumptions).
          role: "contributor",
          app_role: "guardian",
          auth_provider: "seed",
          account_status: "active",
        },
        { onConflict: "id" },
      );
    if (ue) {
      console.error("[seed:users] public.users upsert failed:", t.seed_key, ue.message);
      process.exit(1);
    }
    publicUpserted += 1;

    results.push({
      seed_key: t.seed_key,
      id: t.id,
      email: t.email,
      auth: authStatus,
      public_user: "upserted",
    });
  }

  console.log(
    JSON.stringify(
      {
        summary: {
          auth_created: authCreated,
          auth_updated: authUpdated,
          auth_skipped: authSkipped,
          public_users_upserted: publicUpserted,
          public_users_skipped: publicSkipped,
        },
        preview: results.slice(0, 8),
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

