"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

export type InviteAdminState = { ok?: boolean; error?: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function requireSuperAdminUserId(): Promise<string | null> {
  const sb = await getServerSupabaseForUser();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  if (data?.app_role !== "super_admin") return null;
  return user.id;
}

export async function inviteAdminByEmail(_prev: InviteAdminState | null, formData: FormData): Promise<InviteAdminState> {
  const inviterId = await requireSuperAdminUserId();
  if (!inviterId) return { error: "Forbidden" };

  const emailRaw = formData.get("email");
  const roleRaw = formData.get("role");
  if (typeof emailRaw !== "string" || !emailRaw.trim()) return { error: "Email is required" };

  const role = roleRaw === "super_admin" ? "super_admin" : "admin";
  const email = normalizeEmail(emailRaw);

  const svc = createServiceRoleSupabase();
  if (!svc) return { error: "Server misconfigured" };

  const { error } = await svc.from("admin_accounts").insert({
    email,
    role,
    invited_by_user_id: inviterId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "This email is already registered or invited." };
    return { error: error.message };
  }

  revalidatePath("/admin/managers/invite");
  revalidatePath("/admin/managers");
  return { ok: true };
}
