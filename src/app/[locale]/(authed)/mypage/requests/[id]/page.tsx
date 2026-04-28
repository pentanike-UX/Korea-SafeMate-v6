import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { mockTravelerTripRequests } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

const TIMELINE_STATUSES = ["requested", "reviewing", "matched", "completed"] as const;
type BookingStatus = (typeof TIMELINE_STATUSES)[number] | "cancelled" | "delivered" | "delivering";

function statusIndex(status: string): number {
  const idx = (TIMELINE_STATUSES as readonly string[]).indexOf(status);
  return idx;
}

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const tag =
    locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : locale === "th" ? "th-TH" : locale === "vi" ? "vi-VN" : "en-US";
  try {
    return new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const STATUS_LABEL: Record<string, { en: string; ko: string }> = {
  requested:  { en: "Requested",   ko: "요청 접수" },
  reviewing:  { en: "Reviewing",   ko: "검토 중" },
  matched:    { en: "Matched",     ko: "매칭 완료" },
  delivering: { en: "Delivering",  ko: "루트 전달 중" },
  completed:  { en: "Completed",   ko: "완료" },
  cancelled:  { en: "Cancelled",   ko: "취소됨" },
};

function statusLabel(status: string, locale: string): string {
  const entry = STATUS_LABEL[status];
  if (!entry) return status;
  return locale === "ko" ? entry.ko : entry.en;
}

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return { title: `${t("navRequests")} — ${BRAND.name}` };
}

export default async function TravelerRequestDetailPage({ params }: Props) {
  const { id, locale } = await params;

  // ── Supabase 실 데이터 시도 ──────────────────────────────────────────────
  const travelerId = await getSupabaseAuthUserIdOnly();
  const sb = await getServerSupabaseForUser();

  let booking: {
    id: string;
    status: string;
    tier: string | null;
    notes: string | null;
    requested_start: string | null;
    delivered_at: string | null;
    revision_count: number | null;
    routes: { id: string }[] | null;
  } | null = null;

  if (travelerId && sb) {
    const { data } = await sb
      .from("bookings")
      .select("id, status, tier, notes, requested_start, delivered_at, revision_count, routes(id)")
      .eq("id", id)
      .eq("traveler_user_id", travelerId)
      .maybeSingle();
    booking = data ?? null;
  }

  // ── Fallback: mock 데이터 (Supabase 미연결 or 미매칭) ──────────────────
  if (!booking) {
    const mock = mockTravelerTripRequests.find((item) => item.id === id);
    if (!mock) notFound();
    // mock 구조를 booking 인터페이스에 맞게 변환
    booking = {
      id: mock.id,
      status: mock.status,
      tier: null,
      notes: mock.note ?? null,
      requested_start: null,
      delivered_at: null,
      revision_count: 0,
      routes: null,
    };
  }

  const currentIndex = statusIndex(booking.status);
  const routeId = Array.isArray(booking.routes) && booking.routes.length > 0
    ? booking.routes[0]?.id
    : null;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      {/* 헤더 */}
      <header className="space-y-1.5">
        <p className="text-xs font-semibold tracking-widest text-ink-soft uppercase">Request</p>
        <h1 className="font-serif text-2xl font-semibold text-ink">Request Status</h1>
        {booking.tier && (
          <span className="inline-flex items-center rounded-full border border-line bg-bg-sunken px-3 py-0.5 text-xs font-semibold text-ink-muted uppercase">
            {booking.tier}
          </span>
        )}
      </header>

      {/* 날짜 + 메모 */}
      {(booking.requested_start || booking.notes) && (
        <div className="rounded-[var(--radius-xl)] border border-line-soft bg-bg-card p-4 space-y-2 text-sm">
          {booking.requested_start && (
            <p className="text-ink-muted">
              Date: <span className="font-medium text-ink">{fmtDate(booking.requested_start, locale)}</span>
            </p>
          )}
          {booking.notes && (
            <p className="text-ink-muted">
              Notes: <span className="text-ink">{booking.notes}</span>
            </p>
          )}
        </div>
      )}

      {/* 진행 타임라인 */}
      <div className="rounded-[var(--radius-xl)] border border-line bg-bg-card p-5 space-y-4">
        <h2 className="font-serif text-lg font-semibold text-ink">Progress</h2>

        {/* 현재 상태 뱃지 */}
        <span className={[
          "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold",
          booking.status === "completed"  ? "border-ok/30 bg-ok/10 text-ok" :
          booking.status === "cancelled"  ? "border-destructive/30 bg-destructive/10 text-destructive" :
          booking.status === "matched"    ? "border-accent-ksm/30 bg-accent-soft/40 text-accent-dark" :
          "border-line bg-bg-sunken text-ink-muted",
        ].join(" ")}>
          {statusLabel(booking.status, locale)}
        </span>

        <ol className="space-y-3">
          {TIMELINE_STATUSES.map((status, index) => {
            const done = currentIndex >= index;
            return (
              <li key={status} className="flex items-center gap-3">
                <span className={[
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done ? "bg-ink text-bg" : "bg-bg-sunken text-ink-muted border border-line",
                ].join(" ")}>
                  {index + 1}
                </span>
                <p className={`text-sm ${done ? "font-semibold text-ink" : "text-ink-muted"}`}>
                  {statusLabel(status, locale)}
                </p>
                {done && index === currentIndex && (
                  <span className="ml-auto text-[10px] font-semibold text-accent-ksm">← now</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* 액션 */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="rounded-[var(--radius-md)] border-line">
          <Link href="/mypage/requests">← All requests</Link>
        </Button>
        {(booking.status === "matched" || booking.status === "completed" || booking.status === "delivering") && routeId && (
          <Button asChild className="rounded-[var(--radius-md)] bg-accent-ksm text-white hover:bg-accent-dark">
            <Link href={`/routes/${routeId}`}>View my route →</Link>
          </Button>
        )}
        {(booking.status === "matched" || booking.status === "completing") && !routeId && (
          <Button asChild className="rounded-[var(--radius-md)] bg-accent-ksm text-white hover:bg-accent-dark">
            <Link href="/routes/mock">View route (preview) →</Link>
          </Button>
        )}
      </div>
    </main>
  );
}
