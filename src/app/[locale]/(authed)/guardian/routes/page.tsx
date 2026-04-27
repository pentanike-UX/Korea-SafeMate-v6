import { Link } from "@/i18n/navigation";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function pickTitle(row: {
  title_ko: string | null;
  title_en: string | null;
  title_th: string | null;
  title_vi: string | null;
}) {
  return row.title_ko ?? row.title_en ?? row.title_th ?? row.title_vi ?? "Untitled route";
}

export default async function GuardianRoutesListPage() {
  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">내 루트</h1>
        <p className="text-sm text-muted-foreground">인증 구성이 없어 루트 목록을 불러올 수 없습니다.</p>
      </main>
    );
  }

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">내 루트</h1>
        <p className="text-sm text-muted-foreground">로그인 후 다시 시도해 주세요.</p>
      </main>
    );
  }

  const { data: routes } = await sb
    .from("routes")
    .select("id, order_id, route_type, status, title_ko, title_en, title_th, title_vi, updated_at")
    .eq("guardian_user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  const rows = routes ?? [];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">내 루트</h1>
          <p className="text-sm text-muted-foreground">
            내가 전달한 커스텀 루트와 상태를 확인하고 주문 워크스페이스로 이동할 수 있습니다.
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/guardian/routes/new">새 루트 전달</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardHeader>
            <CardTitle>아직 전달한 루트가 없어요</CardTitle>
            <CardDescription>매칭된 주문에서 루트를 작성하면 이 목록에 나타납니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/guardian/matches">매칭 보기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card className="rounded-2xl border-border/70">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{pickTitle(r)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.route_type} · {r.status}
                      {r.order_id ? ` · booking ${String(r.order_id).slice(0, 8)}...` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.order_id ? (
                      <Button asChild variant="outline" size="sm" className="rounded-lg">
                        <Link href={`/guardian/orders/${r.order_id}`}>주문 워크스페이스</Link>
                      </Button>
                    ) : null}
                    <Button asChild size="sm" className="rounded-lg">
                      <Link href={`/routes/${r.id}`}>타임라인 보기</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
