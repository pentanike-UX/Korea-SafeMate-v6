export const metadata = {
  title: "Users | Admin",
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Users</h1>
      <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
        Directory and RBAC tooling will connect to Supabase here. Mock admin remains English-first.
      </p>
    </div>
  );
}
