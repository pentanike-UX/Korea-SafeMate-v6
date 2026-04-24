import Link from "next/link";

export const metadata = {
  title: "Policy settings | Admin",
};

export default function AdminPoliciesSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Policies</h1>
      <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
        Cross-cutting product policies. Point reward parameters are edited under Points → Policy.
      </p>
      <Link href="/admin/points/policy" className="text-primary text-sm font-semibold">
        Open points policy →
      </Link>
    </div>
  );
}
