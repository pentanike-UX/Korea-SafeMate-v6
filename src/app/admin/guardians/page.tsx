import { redirect } from "next/navigation";
import { mockGuardians } from "@/data/mock";
import { AdminGuardiansTable } from "@/components/admin/admin-guardians-table";
import {
  AdminGuardianApplications,
  type AdminGuardianApplication,
} from "@/components/admin/admin-guardian-applications";
import { AdminOpsPillarHeader } from "@/components/admin/admin-ops-pillar";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export const metadata = {
  title: "Guardians | Admin",
};

export default async function AdminGuardiansPage() {
  // 실데이터(지원서 PII)를 노출하므로 실제 세션 + admin 권한 게이트.
  const sb = await getServerSupabaseForUser();
  if (!sb) redirect("/login");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: urow } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  if (!urow || !["admin", "super_admin"].includes(urow.app_role as string)) {
    redirect("/admin/dashboard");
  }

  // 지원서는 service-role로 조회 (admin RLS 정책이 'admin'만 매칭 → super_admin 포함 위해 우회).
  let applications: AdminGuardianApplication[] = [];
  const svc = createServiceRoleSupabase();
  if (svc) {
    const { data } = await svc
      .from("guardian_applications")
      .select("id, status, real_name, display_name, contact_email, languages, motivation, review_note, residence_proof, sample_route, created_at")
      .order("created_at", { ascending: false });
    applications = (data as AdminGuardianApplication[] | null) ?? [];
  }
  const pending = applications.filter((a) => a.status === "pending" || a.status === "needs_revision");

  return (
    <div className="space-y-10">
      <div>
        <AdminOpsPillarHeader
          pillar="trust"
          title="Guardian trust & program"
          description="Distinct from booking rows and from the content moderation queue. Tier and matching_enabled are policy levers — not automatic from post volume."
        />
        <h1 className="text-foreground mt-4 text-2xl font-semibold tracking-tight">Guardians</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Directory view with filters (mock). Contribution counts inform signals; ops approves trusted matching.
        </p>
      </div>

      <div>
        <h2 className="text-foreground mb-1 text-sm font-semibold tracking-tight">지원서 검토</h2>
        <p className="text-muted-foreground mb-3 text-xs">
          검토 대기 {pending.length}건{svc ? "" : " · service-role 미설정(로컬) — 조회 불가"}
        </p>
        <AdminGuardianApplications applications={pending} />
      </div>

      <div>
        <h2 className="text-foreground mb-3 text-sm font-semibold tracking-tight">Program directory</h2>
        <AdminGuardiansTable guardians={mockGuardians} />
      </div>
    </div>
  );
}
