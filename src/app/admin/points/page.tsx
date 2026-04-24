import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, SlidersHorizontal } from "lucide-react";

export const metadata = {
  title: "Points | Admin",
};

export default function AdminPointsHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Points</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Policy versions, caps, and manual ledger adjustments.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
          <CardHeader>
            <Coins className="text-primary size-8" strokeWidth={1.5} aria-hidden />
            <CardTitle className="text-lg">Policy</CardTitle>
            <CardDescription>Reward timing, limits, and activation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/points/policy" className="text-primary text-sm font-semibold">
              Open policy →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
          <CardHeader>
            <SlidersHorizontal className="text-primary size-8" strokeWidth={1.5} aria-hidden />
            <CardTitle className="text-lg">Adjust</CardTitle>
            <CardDescription>Manual positive or negative ledger entries.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/points/adjust" className="text-primary text-sm font-semibold">
              Open adjust →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
