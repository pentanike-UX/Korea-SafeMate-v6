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
  return { title: `${t("revisionTitle")} — ${BRAND.name}` };
}

export default async function GuardianOrderRevisionPage({ params }: Props) {
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
      "id, guardian_user_id, status, revision_count, max_revisions, revision_request_text, revision_requested_at, delivered_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!booking || booking.guardian_user_id !== user.id) notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{t("revisionTitle")}</h1>
        <p className="font-mono text-xs text-ink-soft">{booking.id}</p>
      </div>

      {/* 현재 상태 */}
      <div className="rounded-[var(--radius-xl)] border border-line bg-bg-card p-5 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-ink">{t("revisionStatus")}</h2>
        <div className="grid gap-1.5 text-sm sm:grid-cols-2">
          <div>
            <span className="text-xs text-ink-muted">Status</span>
            <p className="font-medium text-ink">{booking.status}</p>
          </div>
          <div>
            <span className="text-xs text-ink-muted">{t("ordersRevisionLabel")}</span>
            <p className="font-medium text-ink">{booking.revision_count ?? 0}/{booking.max_revisions ?? 1}</p>
          </div>
          <div>
            <span className="text-xs text-ink-muted">Revision requested</span>
            <p className="font-medium text-ink">{fmtDate(booking.revision_requested_at, locale)}</p>
          </div>
          <div>
            <span className="text-xs text-ink-muted">Last delivered</span>
            <p className="font-medium text-ink">{fmtDate(booking.delivered_at, locale)}</p>
          </div>
        </div>
      </div>

      {/* 수정 요청 메모 */}
      <div className="rounded-[var(--radius-xl)] border border-line bg-bg-card p-5 space-y-2">
        <h2 className="font-serif text-lg font-semibold text-ink">{t("revisionMemoTitle")}</h2>
        {booking.revision_request_text?.trim() ? (
          <div className="rounded-[var(--radius-md)] border border-gold/30 bg-gold/10 px-4 py-3">
            <p className="text-sm text-ink whitespace-pre-wrap">{booking.revision_request_text}</p>
          </div>
        ) : (
          <p className="text-sm text-ink-muted italic">{t("revisionMemoEmpty")}</p>
        )}
      </div>

      {/* 액션 */}
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-[var(--radius-md)] bg-accent-ksm text-white hover:bg-accent-dark">
          <Link href={`/guardian/routes/new?booking_id=${booking.id}`}>{t("revisionSubmitBtn")} →</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-[var(--radius-md)] border-line">
          <Link href={`/guardian/orders/${booking.id}`}>{t("revisionBackBtn")}</Link>
        </Button>
      </div>
    </main>
  );
}
