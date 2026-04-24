import { getActivePointPolicy, listPointPolicyVersions } from "@/lib/points/point-policy-repository";
import { AdminOpsPillarHeader } from "@/components/admin/admin-ops-pillar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activatePolicyVersionAction, createPointPolicyAction, syncGuardianProfileRewardsAction } from "./actions";

export const metadata = {
  title: "Points policy | Admin",
};

export default async function AdminPointsPolicyPage() {
  const [policies, active] = await Promise.all([listPointPolicyVersions(), getActivePointPolicy()]);

  return (
    <div className="space-y-10">
      <div>
        <AdminOpsPillarHeader
          pillar="content"
          title="Points & rewards policy"
          description="Ledger-based accrual. Values drive grant timing, caps, revokes, and match completion rewards."
        />
        <h1 className="text-foreground mt-4 text-2xl font-semibold tracking-tight">Point policy</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Active version:{" "}
          <span className="text-foreground font-mono text-xs font-semibold">
            {active?.version_code ?? "— (run DB migration + Supabase)"}
          </span>
        </p>
      </div>

      <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="text-lg">Create policy version</CardTitle>
          <CardDescription>New row; optionally activate immediately. Match timing stays confirmed_only.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createPointPolicyAction} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="version_code">version_code</Label>
              <Input id="version_code" name="version_code" className="mt-1.5 font-mono text-sm" placeholder="v2-2026-03" required />
            </div>
            <div>
              <Label htmlFor="profile_signup_reward">Profile reward (P)</Label>
              <Input id="profile_signup_reward" name="profile_signup_reward" type="number" defaultValue={300} className="mt-1.5 tabular-nums" />
            </div>
            <div>
              <Label htmlFor="profile_reward_timing">Profile timing</Label>
              <select
                id="profile_reward_timing"
                name="profile_reward_timing"
                className="border-input bg-background mt-1.5 flex h-10 w-full rounded-md border px-3 text-sm"
                defaultValue="immediate"
              >
                <option value="immediate">immediate</option>
                <option value="approval">approval</option>
              </select>
            </div>
            <div>
              <Label htmlFor="post_publish_reward">Post reward (P)</Label>
              <Input id="post_publish_reward" name="post_publish_reward" type="number" defaultValue={100} className="mt-1.5 tabular-nums" />
            </div>
            <div>
              <Label htmlFor="post_reward_timing">Post timing</Label>
              <select
                id="post_reward_timing"
                name="post_reward_timing"
                className="border-input bg-background mt-1.5 flex h-10 w-full rounded-md border px-3 text-sm"
                defaultValue="immediate"
              >
                <option value="immediate">immediate</option>
                <option value="approval">approval (needs moderation_reward_ok)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="post_daily_limit">Post daily cap (P)</Label>
              <Input id="post_daily_limit" name="post_daily_limit" type="number" defaultValue={300} className="mt-1.5 tabular-nums" />
            </div>
            <div>
              <Label htmlFor="post_monthly_limit">Post monthly cap (P)</Label>
              <Input id="post_monthly_limit" name="post_monthly_limit" type="number" defaultValue={3000} className="mt-1.5 tabular-nums" />
            </div>
            <div>
              <Label htmlFor="match_complete_reward">Match complete (P / side)</Label>
              <Input
                id="match_complete_reward"
                name="match_complete_reward"
                type="number"
                defaultValue={700}
                className="mt-1.5 tabular-nums"
              />
            </div>
            <div className="flex flex-col justify-end gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="allow_revoke_on_post_delete" defaultChecked className="size-4 rounded border" />
                Revoke on delete/hide
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="allow_revoke_on_policy_violation" defaultChecked className="size-4 rounded border" />
                Revoke on policy violation
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="set_active" className="size-4 rounded border" />
                Set as active policy (deactivates others)
              </label>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="rounded-xl font-semibold">
                Save policy version
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="text-lg">Activate version</CardTitle>
          <CardDescription>Exactly one active row is enforced in the database.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={activatePolicyVersionAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Label htmlFor="policy_id">Policy id</Label>
              <select
                id="policy_id"
                name="policy_id"
                className="border-input bg-background mt-1.5 flex h-10 w-full rounded-md border px-3 text-sm"
                required
                defaultValue={active?.id ?? ""}
              >
                <option value="">Select…</option>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.version_code} {p.is_active ? "(active)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary" className="rounded-xl font-semibold">
              Activate
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="text-lg">Guardian profile rewards</CardTitle>
          <CardDescription>Idempotent sweep: applies active policy to every guardian_profiles row.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={syncGuardianProfileRewardsAction}>
            <Button type="submit" variant="secondary" className="rounded-xl font-semibold">
              Run profile reward sync
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-foreground mb-3 text-sm font-semibold tracking-tight">Versions</h2>
        <ul className="border-border/60 divide-border/60 divide-y overflow-hidden rounded-xl border">
          {policies.length === 0 ? (
            <li className="text-muted-foreground bg-card px-4 py-6 text-sm">No rows — apply migration `20260325180000_points_policy_system.sql`.</li>
          ) : (
            policies.map((p) => (
              <li key={p.id} className="bg-card flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold">{p.version_code}</p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    profile {p.profile_signup_reward}P · post {p.post_publish_reward}P · match {p.match_complete_reward}P/side
                  </p>
                </div>
                {p.is_active ? (
                  <span className="text-primary text-xs font-bold tracking-wide uppercase">active</span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
