import Link from "next/link";
import { redirect } from "next/navigation";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { Button } from "@/components/ui/button";

type AdminAccountRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  linked_user_id: string | null;
};

export const metadata = {
  title: "Managers | Admin",
};

export default async function AdminManagersPage() {
  const sb = await getServerSupabaseForUser();
  if (!sb) redirect("/login");

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: urow } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  if (urow?.app_role !== "super_admin") redirect("/admin/dashboard");

  const svc = createServiceRoleSupabase();
  if (!svc) {
    return <p className="text-muted-foreground text-sm">Service role is not configured.</p>;
  }

  const { data: invitesRaw } = await svc
    .from("admin_accounts")
    .select("id, email, role, status, invited_at, accepted_at, linked_user_id")
    .order("invited_at", { ascending: false })
    .limit(100);

  const invites = (invitesRaw ?? []) as AdminAccountRow[];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Managers</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
            Admin and super_admin invitations. Only listed emails can activate elevated roles on Google sign-in.
          </p>
        </div>
        <Button asChild className="h-9 w-full shrink-0 rounded-lg sm:w-auto">
          <Link href="/admin/managers/invite">Invite manager</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <ul className="divide-border/60 divide-y">
          {invites.length === 0 ? (
            <li className="text-muted-foreground px-4 py-6 text-sm">No rows yet.</li>
          ) : (
            invites.map((row) => (
              <li key={row.id} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{row.email}</p>
                  <p className="text-muted-foreground text-xs">
                    {row.role} · {row.status}
                    {row.linked_user_id ? " · linked" : ""}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs tabular-nums">
                  invited {new Date(row.invited_at).toLocaleString()}
                  {row.accepted_at ? ` · accepted ${new Date(row.accepted_at).toLocaleString()}` : ""}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
