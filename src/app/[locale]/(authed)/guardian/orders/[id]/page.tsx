import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const tag =
    locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : locale === "th" ? "th-TH" : locale === "vi" ? "vi-VN" : "en-US";
  try {
    return new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("GuardianOps");
  return { title: `${t("ordersWorkspace")} — ${BRAND.name}` };
}

export default async function GuardianOrderDetailPage({ params }: Props) {
  const { id, locale } = await params;
  const t = await getTranslations("GuardianOps");

  // Auth guard는 layout.tsx에서 처리됨. 빌드타임 fallback 방어.
  const sb = await getServerSupabaseForUser();
  if (!sb) notFound();
  const { data: { user } } = await sb!.auth.getUser();
  if (!user) notFound();

  const { data: booking } = await sb!
    .from("bookings")
    .select(
      "id, guardian_user_id, traveler_user_id, status, tier, notes, requested_start, delivery_deadline_at, delivered_at, revision_count, max_revisions, revision_request_text, revision_requested_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!booking || booking.guardian_user_id !== user.id) notFound();

  const { data: route } = await sb!
    .from("routes")
    .select("id, status, title_ko, title_en, title_th, title_vi, updated_at")
    .eq("guardian_user_id", user.id)
    .eq("order_id", id)
    .eq("route_type", "custom")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const routeTitle =
    (locale === "ko" ? route?.title_ko : locale === "th" ? route?.title_th : locale === "vi" ? route?.title_vi : route?.title_en)
    ?? route?.title_ko ?? route?.title_en ?? "Untitled route";

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* 헤더 */}
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{t("ordersWorkspace")}</h1>
        <p className="font-mono text-xs text-ink-soft">{booking.id}</p>
      </div>

      {/* 의뢰 상태 카드 */}
      <div className="rounded-[var(--radius-xl)] border border-line bg-bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-line bg-bg-sunken px-3 py-0.5 text-xs font-semibold text-ink-muted uppercase">
            {booking.status}
          </span>
          {booking.tier && (
            <span className="rounded-full border border-line bg-bg-sunken px-3 py-0.5 text-xs font-semibold text-ink-muted uppercase">
              {booking.tier}
            </span>
          )}
        </div>

        <div className="grid gap-1.5 text-sm sm:grid-cols-2">
          <div>
            <span className="text-xs text-ink-muted">{t("ordersRequestedLabel")}</span>
            <p className="font-medium text-ink">{fmtDate(booking.requested_start, locale)}</p>
          </div>
          <div>
            <span className="text-xs text-ink-muted">Deadline</span>
            <p className="font-medium text-ink">{fmtDate(booking.delivery_deadline_at, locale)}</p>
          </div>
          <div>
            <span className="text-xs text-ink-muted">{t("ordersDeliveredLabel")}</span>
            <p className="font-medium text-ink">{fmtDate(booking.delivered_at, locale)}</p>
          </div>
          <div>
            <span className="text-xs text-ink-muted">{t("ordersRevisionLabel")}</span>
            <p className="font-medium text-ink">{booking.revision_count ?? 0}/{booking.max_revisions ?? 1}</p>
          </div>
        </div>

        {booking.notes && (
          <div className="rounded-[var(--radius-md)] border border-line-soft bg-bg-sunken px-4 py-3">
            <p className="text-xs font-semibold text-ink-muted mb-1">Traveler notes</p>
            <p className="text-sm text-ink whitespace-pre-wrap">{booking.notes}</p>
          </div>
        )}

        {booking.revision_request_text && booking.revision_requested_at && (
          <div className="rounded-[var(--radius-md)] border border-gold/30 bg-gold/10 px-4 py-3">
            <p className="text-xs font-semibold text-gold mb-1">
              {t("revisionMemoTitle")} · {fmtDate(booking.revision_requested_at, locale)}
            </p>
            <p className="text-sm text-ink whitespace-pre-wrap">{booking.revision_request_text}</p>
          </div>
        )}
      </div>

      {/* 연결된 루트 */}
      <div className="rounded-[var(--radius-xl)] border border-line bg-bg-card p-5 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-ink">Connected route</h2>
        {route ? (
          <>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-ok/30 bg-ok/10 px-2.5 py-0.5 text-xs font-semibold text-ok">
                {route.status}
              </span>
              <p className="text-sm font-medium text-ink">{routeTitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-[var(--radius-md)] bg-accent-ksm text-white hover:bg-accent-dark">
                <Link href={`/routes/${route.id}`}>{t("routesViewTimeline")} →</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-[var(--radius-md)] border-line">
                <Link href={`/guardian/routes/new?booking_id=${booking.id}`}>{t("revisionSubmitBtn")}</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">No custom route yet.</p>
            <Button asChild size="sm" className="rounded-[var(--radius-md)] bg-accent-ksm text-white hover:bg-accent-dark">
              <Link href={`/guardian/routes/new?booking_id=${booking.id}`}>Start route →</Link>
            </Button>
          </div>
        )}
      </div>

      {/* 하단 액션 */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="rounded-[var(--radius-md)] border-line">
          <Link href="/guardian/orders">← {t("ordersTitle")}</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-[var(--radius-md)] border-line">
          <Link href={`/guardian/orders/${booking.id}/revision`}>{t("revisionTitle")}</Link>
        </Button>
      </div>
    </main>
  );
}
