import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { InviteAdminForm } from "./invite-admin-form";

export const metadata = {
  title: "Invite manager | Admin",
};

export default async function AdminManagersInvitePage() {
  const sb = await getServerSupabaseForUser();
  if (!sb) redirect("/login");

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: urow } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  if (urow?.app_role !== "super_admin") redirect("/admin/dashboard");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/managers" className="text-muted-foreground hover:text-foreground text-sm font-medium">
          ← Back to managers
        </Link>
        <h1 className="text-foreground mt-4 text-2xl font-semibold tracking-tight">Invite manager</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          The invitee must sign in with Google using the same email address.
        </p>
      </div>
      <InviteAdminForm />
    </div>
  );
}
