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

export default async function GuardianOrderRevisionPage({ params }: Props) {
  const { id } = await params;
  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">수정 요청 워크스페이스</h1>
        <p className="text-sm text-muted-foreground">인증 구성이 없어 수정 요청 정보를 불러올 수 없습니다.</p>
      </main>
    );
  }
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) notFound();

  const { data: booking } = await sb
    .from("bookings")
    .select("id, guardian_user_id, status, revision_count, max_revisions, revision_request_text, revision_requested_at, delivered_at")
    .eq("id", id)
    .maybeSingle();
  if (!booking || booking.guardian_user_id !== user.id) notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">수정 요청 워크스페이스</h1>
        <p className="font-mono text-xs text-muted-foreground">{booking.id}</p>
      </div>

      <Card className="rounded-2xl border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">현재 상태</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>booking.status: {booking.status}</p>
          <p>revision_count / max_revisions: {(booking.revision_count ?? 0)} / {(booking.max_revisions ?? 1)}</p>
          <p>revision_requested_at: {fmtDate(booking.revision_requested_at)}</p>
          <p>last_delivered_at: {fmtDate(booking.delivered_at)}</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">트래블러 수정 요청 메모</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {booking.revision_request_text?.trim() || "요청 메모가 없습니다."}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-xl">
          <Link href={`/guardian/routes/new?booking_id=${booking.id}`}>수정본 작성/전달</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/guardian/orders/${booking.id}`}>주문 워크스페이스로</Link>
        </Button>
      </div>
    </main>
  );
}
