import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppAccountRole } from "@/lib/auth/app-role";
import { legacyUserRoleFromAppRole } from "@/lib/auth/app-role";

export async function syncEmailUserFromSession(user: User, sb: SupabaseClient): Promise<void> {
  if (!user.email) return;

  const now = new Date().toISOString();
  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    user.email.split("@")[0] ||
    "Traveler";

  const { data: existing } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  const appRole = ((existing?.app_role as AppAccountRole | undefined) ?? "traveler");

  const { error: userErr } = await sb.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      app_role: appRole,
      role: legacyUserRoleFromAppRole(appRole),
      auth_provider: "email",
      legal_name: fullName,
      last_login_at: now,
    },
    { onConflict: "id" },
  );
  if (userErr) {
    console.error("[auth sync] email users upsert", userErr);
    return;
  }

  const { data: profile } = await sb.from("user_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!profile) {
    const { error: insertErr } = await sb.from("user_profiles").insert({
      user_id: user.id,
      display_name: fullName,
      login_provider: "email",
      profile_fields_locked: false,
      preferred_lang: "en",
    });
    if (insertErr) {
      console.error("[auth sync] email profile insert", insertErr);
    }
  }
}
