/* TODO(i18n): Admin remains English-first. */
import { adminListRoutePasses, requireSuperAdminUserId } from "@/lib/route-access-admin.server";
import { redirect } from "next/navigation";
import { AdminRoutePassesClient } from "@/app/admin/route-passes/client";

export const metadata = {
  title: "Route Passes | Admin · 하루",
};

export default async function AdminRoutePassesPage() {
  const adminId = await requireSuperAdminUserId();
  if (!adminId) redirect("/admin");
  const { grants, invites, packs } = await adminListRoutePasses();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-600">Route Passes</p>
        <h1 className="text-foreground mt-1 font-serif text-2xl font-semibold sm:text-3xl">
          Grants · Invites · Ticket packs
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Audit owned routes, share invites, and ticket packs across the platform. Issue comp grants for CS,
          expire abusive grants, or revoke individual invites.
        </p>
      </header>
      <AdminRoutePassesClient grants={grants} invites={invites} packs={packs} />
    </div>
  );
}
