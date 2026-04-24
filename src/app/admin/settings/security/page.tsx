export const metadata = {
  title: "Security settings | Admin",
};

export default function AdminSecuritySettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Security</h1>
      <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
        Super-admin only. Session policies, IP allowlists, and audit exports — placeholders for production.
      </p>
    </div>
  );
}
