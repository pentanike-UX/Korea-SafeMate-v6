import { Link } from "@/i18n/navigation";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function GuardianOrdersPage() {
  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">받은 의뢰</h1>
        <p className="text-sm text-muted-foreground">인증 구성이 없어 주문 목록을 불러올 수 없습니다.</p>
      </main>
    );
  }
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">받은 의뢰</h1>
        <p className="text-sm text-muted-foreground">로그인 후 다시 시도해 주세요.</p>
      </main>
    );
  }

  const { data: orders } = await sb
    .from("bookings")
    .select("id, status, tier, requested_start, delivery_deadline_at, delivered_at, revision_count, max_revisions, updated_at")
    .eq("guardian_user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  const rows = orders ?? [];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">받은 의뢰</h1>
        <p className="text-sm text-muted-foreground">주문별 상태와 리비전 진행 상황을 확인하고 워크스페이스로 이동합니다.</p>
      </div>

      {rows.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardHeader>
            <CardTitle>아직 받은 의뢰가 없습니다</CardTitle>
            <CardDescription>매칭이 생성되면 주문이 여기에 표시됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/guardian/matches">매칭 보기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((o) => (
            <li key={o.id}>
              <Card className="rounded-2xl border-border/70">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <p className="font-mono text-xs text-muted-foreground">{o.id}</p>
                    <p className="text-sm font-semibold">{o.status} · {o.tier ?? "tier-unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      요청 {fmtDate(o.requested_start)} · 전달 {fmtDate(o.delivered_at)} · 수정 {o.revision_count ?? 0}/{o.max_revisions ?? 1}
                    </p>
                  </div>
                  <Button asChild size="sm" className="rounded-lg">
                    <Link href={`/guardian/orders/${o.id}`}>워크스페이스</Link>
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
