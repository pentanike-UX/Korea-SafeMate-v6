import { Link } from "@/i18n/navigation";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function won(cents: number): string {
  const krw = Math.round(cents / 100);
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(krw);
}

export default async function GuardianEarningsPage() {
  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">수익 대시보드</h1>
        <p className="text-sm text-muted-foreground">인증 구성이 없어 수익 정보를 불러올 수 없습니다.</p>
      </main>
    );
  }
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">수익 대시보드</h1>
        <p className="text-sm text-muted-foreground">로그인 후 다시 시도해 주세요.</p>
      </main>
    );
  }

  const { data: rows } = await sb
    .from("orders")
    .select("id, booking_id, payment_status, payout_status, gross_amount_krw_cents, guardian_payout_krw_cents, paid_at, paid_out_at, created_at")
    .eq("guardian_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = rows ?? [];
  let totalGross = 0;
  let totalPayout = 0;
  let pendingPayout = 0;
  for (const r of list) {
    totalGross += r.gross_amount_krw_cents ?? 0;
    totalPayout += r.guardian_payout_krw_cents ?? 0;
    if (r.payout_status !== "paid") pendingPayout += r.guardian_payout_krw_cents ?? 0;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">수익 대시보드</h1>
        <p className="text-sm text-muted-foreground">주문 결제/정산 현황을 확인합니다.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl border-border/70">
          <CardHeader><CardTitle className="text-base">총 결제액</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-semibold">{won(totalGross)}</p></CardContent>
        </Card>
        <Card className="rounded-2xl border-border/70">
          <CardHeader><CardTitle className="text-base">누적 정산 대상</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-semibold">{won(totalPayout)}</p></CardContent>
        </Card>
        <Card className="rounded-2xl border-border/70">
          <CardHeader><CardTitle className="text-base">미정산 금액</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-semibold">{won(pendingPayout)}</p></CardContent>
        </Card>
      </div>

      {list.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-muted-foreground">아직 주문 정산 데이터가 없습니다.</p>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/guardian/orders">받은 의뢰 보기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r.id}>
              <Card className="rounded-2xl border-border/70">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="space-y-1">
                    <p className="font-mono text-xs text-muted-foreground">{r.id}</p>
                    <p className="text-sm">
                      결제 {r.payment_status} · 정산 {r.payout_status} · 가디언 정산액 {won(r.guardian_payout_krw_cents ?? 0)}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-lg">
                    <Link href={`/guardian/orders/${r.booking_id}`}>주문 보기</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
