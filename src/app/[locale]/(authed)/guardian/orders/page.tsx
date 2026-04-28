import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("GuardianOps");
  return { title: `${t("ordersTitle")} — ${BRAND.name}` };
}

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const localeTag =
    locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : locale === "th" ? "th-TH" : locale === "vi" ? "vi-VN" : "en-US";
  try {
    return new Intl.DateTimeFormat(localeTag, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const STATUS_STYLES: Record<string, string> = {
  requested:  "bg-gold/15 text-gold border-gold/30",
  reviewing:  "bg-blue-500/10 text-blue-700 border-blue-300/40",
  matched:    "bg-ok/15 text-ok border-ok/30",
  delivering: "bg-accent-soft text-accent-dark border-accent-ksm/30",
  completed:  "bg-bg-sunken text-ink-muted border-line",
  cancelled:  "bg-destructive/10 text-destructive border-destructive/30",
};

export default async function GuardianOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("GuardianOps");

  // Auth guard는 layout.tsx에서 처리됨. 빌드타임 fallback 방어.
  const sb = await getServerSupabaseForUser();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: orders } = await sb!
    .from("bookings")
    .select(
      "id, status, tier, notes, requested_start, delivery_deadline_at, delivered_at, revision_count, max_revisions, updated_at",
    )
    .eq("guardian_user_id", user!.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  const rows = orders ?? [];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{t("ordersTitle")}</h1>
        <p className="text-sm text-ink-muted">{t("ordersLead")}</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-line bg-bg-card p-8 text-center space-y-3">
          <p className="font-semibold text-ink">{t("ordersEmpty")}</p>
          <p className="text-sm text-ink-muted">{t("ordersEmptyLead")}</p>
          <Button asChild variant="outline" className="rounded-[var(--radius-md)] border-line">
            <Link href="/guardian/matches">{t("ordersViewMatches")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((o) => {
            const statusStyle = STATUS_STYLES[o.status] ?? STATUS_STYLES.requested;
            return (
              <li key={o.id}>
                <div className="rounded-[var(--radius-xl)] border border-line bg-bg-card p-4 shadow-[var(--shadow-sm)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      {/* 상태 + 티어 뱃지 */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}>
                          {o.status}
                        </span>
                        {o.tier && (
                          <span className="rounded-full border border-line bg-bg-sunken px-2.5 py-0.5 text-xs font-semibold text-ink-muted uppercase">
                            {o.tier}
                          </span>
                        )}
                      </div>

                      {/* 날짜 정보 */}
                      <div className="space-y-0.5 text-xs text-ink-muted">
                        <p>
                          {t("ordersRequestedLabel")}: <span className="font-medium text-ink">{fmtDate(o.requested_start, locale)}</span>
                        </p>
                        {o.delivered_at && (
                          <p>
                            {t("ordersDeliveredLabel")}: <span className="font-medium text-ink">{fmtDate(o.delivered_at, locale)}</span>
                          </p>
                        )}
                        <p>
                          {t("ordersRevisionLabel")}: <span className="font-medium text-ink">{o.revision_count ?? 0}/{o.max_revisions ?? 1}</span>
                        </p>
                      </div>

                      {/* 요청 메모 미리보기 */}
                      {o.notes && (
                        <p className="text-xs text-ink-soft italic line-clamp-1">{o.notes}</p>
                      )}
                    </div>

                    <Button asChild size="sm" className="shrink-0 rounded-[var(--radius-md)] bg-accent-ksm text-white hover:bg-accent-dark">
                      <Link href={`/guardian/orders/${o.id}`}>{t("ordersWorkspace")} →</Link>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
