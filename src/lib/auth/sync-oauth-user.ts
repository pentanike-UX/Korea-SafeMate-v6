import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppAccountRole } from "@/lib/auth/app-role";
import { legacyUserRoleFromAppRole } from "@/lib/auth/app-role";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function googleIdentity(user: User) {
  const ident = user.identities?.find((i) => i.provider === "google");
  const meta = user.user_metadata ?? {};
  const avatar = (typeof meta.avatar_url === "string" && meta.avatar_url) || (typeof meta.picture === "string" && meta.picture) || null;
  const fullName = (typeof meta.full_name === "string" && meta.full_name) || (typeof meta.name === "string" && meta.name) || "";
  const sub =
    (ident?.identity_data?.sub as string | undefined) ||
    (typeof meta.sub === "string" && meta.sub) ||
    user.id;
  return { sub, avatar, fullName };
}

/**
 * Upsert public.users + user_profiles after Google OAuth.
 * - Preserves elevated app_role (admin/super_admin).
 * - Activates pending admin_accounts by email.
 * - Guardian app_role when guardian_profiles.approval_status = approved.
 * - user_profiles: insert on first login; later only fills NULL fields unless profile_fields_locked.
 */
export async function syncOAuthUserFromSession(user: User, sb: SupabaseClient): Promise<void> {
  if (!user.email) return;

  const emailNorm = normalizeEmail(user.email);
  const { sub, avatar, fullName } = googleIdentity(user);
  const now = new Date().toISOString();

  const { data: existing } = await sb
    .from("users")
    .select("id, app_role, email")
    .eq("id", user.id)
    .maybeSingle();

  const existingRole = (existing?.app_role as AppAccountRole | undefined) ?? undefined;

  const { data: invite } = await sb
    .from("admin_accounts")
    .select("id, role, status")
    .eq("email", emailNorm)
    .in("status", ["pending", "active"])
    .maybeSingle();

  const { data: gp } = await sb
    .from("guardian_profiles")
    .select("approval_status, profile_status")
    .eq("user_id", user.id)
    .maybeSingle();

  const guardianApproved =
    gp?.profile_status === "approved" || gp?.approval_status === "approved";

  let nextAppRole: AppAccountRole = "traveler";
  if (existingRole === "super_admin" || existingRole === "admin") {
    nextAppRole = existingRole;
  } else if (invite?.role === "super_admin") {
    nextAppRole = "super_admin";
  } else if (invite?.role === "admin") {
    nextAppRole = "admin";
  } else if (guardianApproved) {
    nextAppRole = "guardian";
  }

  const legacyRole = legacyUserRoleFromAppRole(nextAppRole);

  const { error: upUser } = await sb.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      auth_provider: "google",
      provider_account_id: sub,
      avatar_url: avatar,
      legal_name: fullName || null,
      last_login_at: now,
      app_role: nextAppRole,
      role: legacyRole,
      account_status: "active",
    },
    { onConflict: "id" },
  );

  if (upUser) {
    console.error("[auth sync] users upsert", upUser);
    return;
  }

  if (invite && invite.status === "pending" && (invite.role === "admin" || invite.role === "super_admin")) {
    await sb
      .from("admin_accounts")
      .update({
        status: "active",
        accepted_at: now,
        linked_user_id: user.id,
      })
      .eq("id", invite.id);
  }

  const { data: prof } = await sb.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle();

  if (!prof) {
    const displayName = fullName || emailNorm.split("@")[0] || "User";
    const { error: ins } = await sb.from("user_profiles").insert({
      user_id: user.id,
      display_name: displayName,
      profile_image_url: avatar,
      intro: null,
      locale: null,
      login_provider: "google",
      profile_fields_locked: false,
    });
    if (ins) console.error("[auth sync] user_profiles insert", ins);
    return;
  }

  if (prof.profile_fields_locked) {
    await sb.from("user_profiles").update({ updated_at: now }).eq("user_id", user.id);
    return;
  }

  const patch: Record<string, string | null> = { updated_at: now };
  if (!prof.display_name?.trim() && (fullName || emailNorm)) {
    patch.display_name = fullName || emailNorm.split("@")[0] || prof.display_name;
  }
  if (!prof.profile_image_url && avatar) {
    patch.profile_image_url = avatar;
  }

  if (Object.keys(patch).length > 1) {
    await sb.from("user_profiles").update(patch).eq("user_id", user.id);
  }
}
