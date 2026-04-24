import Link from "next/link";
import { AdminOpsPillarHeader } from "@/components/admin/admin-ops-pillar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { manualPointAdjustmentAction } from "../policy/actions";

export const metadata = {
  title: "Points adjust | Admin",
};

export default function AdminPointsAdjustPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/points" className="text-muted-foreground hover:text-foreground text-sm font-medium">
          ← Points
        </Link>
        <AdminOpsPillarHeader
          pillar="content"
          title="Manual point adjustments"
          description="Positive or negative P; reason is stored on the ledger."
          className="mt-4"
        />
      </div>

      <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="text-lg">Apply adjustment</CardTitle>
          <CardDescription>Use auth user UUIDs from Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={manualPointAdjustmentAction} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="user_id">User id (UUID)</Label>
              <Input id="user_id" name="user_id" className="mt-1.5 font-mono text-xs" placeholder="auth.users id" required />
            </div>
            <div>
              <Label htmlFor="amount">Amount (P)</Label>
              <Input id="amount" name="amount" type="number" className="mt-1.5 tabular-nums" required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" name="reason" className="mt-1.5" required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="outline" className="rounded-xl font-semibold">
                Apply adjustment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
