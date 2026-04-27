import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: Promise<{ id: string }>;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function GuardianOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">의뢰 워크스페이스</h1>
        <p className="text-sm text-muted-foreground">인증 구성이 없어 주문 정보를 불러올 수 없습니다.</p>
      </main>
    );
  }
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) notFound();

  const { data: booking } = await sb
    .from("bookings")
    .select(
      "id, guardian_user_id, traveler_user_id, status, tier, notes, requested_start, delivery_deadline_at, delivered_at, revision_count, max_revisions, revision_request_text, revision_requested_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!booking || booking.guardian_user_id !== user.id) notFound();

  const { data: route } = await sb
    .from("routes")
    .select("id, status, title_ko, title_en, title_th, title_vi, updated_at")
    .eq("guardian_user_id", user.id)
    .eq("order_id", id)
    .eq("route_type", "custom")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">의뢰 워크스페이스</h1>
        <p className="font-mono text-xs text-muted-foreground">{booking.id}</p>
      </div>

      <Card className="rounded-2xl border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">의뢰 상태</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>상태: {booking.status}</p>
          <p>티어: {booking.tier ?? "tier-unknown"}</p>
          <p>요청 시각: {fmtDate(booking.requested_start)}</p>
          <p>전달 마감: {fmtDate(booking.delivery_deadline_at)}</p>
          <p>전달 완료: {fmtDate(booking.delivered_at)}</p>
          <p>수정 정책: {booking.revision_count ?? 0}/{booking.max_revisions ?? 1}</p>
          <p>수정 요청 시각: {fmtDate(booking.revision_requested_at)}</p>
          <p className="whitespace-pre-wrap text-muted-foreground">{booking.revision_request_text ?? "수정 요청 메모 없음"}</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">연결된 루트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {route ? (
            <>
              <p>
                {(route.title_ko ?? route.title_en ?? route.title_th ?? route.title_vi ?? "Untitled route")} · {route.status}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="rounded-lg">
                  <Link href={`/routes/${route.id}`}>타임라인 보기</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-lg">
                  <Link href={`/guardian/routes/new?booking_id=${booking.id}`}>루트 수정 전달</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground">아직 연결된 커스텀 루트가 없습니다.</p>
              <Button asChild size="sm" className="rounded-lg">
                <Link href={`/guardian/routes/new?booking_id=${booking.id}`}>루트 작성 시작</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/guardian/orders">받은 의뢰 목록</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/guardian/orders/${booking.id}/revision`}>수정 요청 보기</Link>
        </Button>
      </div>
    </main>
  );
}
