import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, LayoutDashboard, Shield, Users } from "lucide-react";

export const metadata = {
  title: `Guardian · ${BRAND.name}`,
};

export default function GuardianHubPage() {
  return (
    <div className="page-container space-y-8 py-8 sm:py-10">
      <div>
        <p className="text-primary text-[11px] font-bold tracking-widest uppercase">Guardian</p>
        <h1 className="text-text-strong mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Workspace</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Profile, posts, and matching tools for approved guardians. Use the site header menu for quick jumps on mobile.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
          <CardHeader>
            <Users className="text-primary size-8" strokeWidth={1.5} aria-hidden />
            <CardTitle className="text-lg">Profile</CardTitle>
            <CardDescription>View and edit how travelers see you.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href="/guardian/profile">View profile</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/mypage/guardian/profile/edit">Edit</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
          <CardHeader>
            <FileText className="text-primary size-8" strokeWidth={1.5} aria-hidden />
            <CardTitle className="text-lg">Routes</CardTitle>
            <CardDescription>커스텀 루트 전달/수정 워크스페이스.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-xl font-semibold">
              <Link href="/guardian/routes">Open routes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
          <CardHeader>
            <Shield className="text-primary size-8" strokeWidth={1.5} aria-hidden />
            <CardTitle className="text-lg">Orders</CardTitle>
            <CardDescription>받은 의뢰와 수정 요청 워크스페이스.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="rounded-xl font-semibold">
              <Link href="/guardian/orders">Open orders</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
          <CardHeader>
            <LayoutDashboard className="text-primary size-8" strokeWidth={1.5} aria-hidden />
            <CardTitle className="text-lg">Earnings</CardTitle>
            <CardDescription>주문 결제/정산 수익 현황.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/guardian/earnings">Open earnings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
