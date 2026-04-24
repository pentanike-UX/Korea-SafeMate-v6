import { mockGuardians } from "@/data/mock";
import { AdminGuardiansTable } from "@/components/admin/admin-guardians-table";
import { AdminOpsPillarHeader } from "@/components/admin/admin-ops-pillar";

export const metadata = {
  title: "Guardians | Admin",
};

export default function AdminGuardiansPage() {
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
          {/* TODO(prod): Admin review workflows — tier recompute jobs, verification tasks, matching toggles with audit. */}
          Directory view with filters (mock). Contribution counts inform signals; ops approves trusted matching.
        </p>
      </div>

      <div>
        <h2 className="text-foreground mb-3 text-sm font-semibold tracking-tight">Program directory</h2>
        <AdminGuardiansTable guardians={mockGuardians} />
      </div>
    </div>
  );
}
