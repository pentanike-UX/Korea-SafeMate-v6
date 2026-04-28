import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("GuardianOps");
  return { title: `${t("routesTitle")} — ${BRAND.name}` };
}

function pickTitle(
  row: { title_ko: string | null; title_en: string | null; title_th: string | null; title_vi: string | null },
  locale: string,
): string {
  const v =
    locale === "ko" ? row.title_ko :
    locale === "th" ? row.title_th :
    locale === "vi" ? row.title_vi :
    row.title_en;
  return (v ?? row.title_ko ?? row.title_en ?? "Untitled route").trim() || "Untitled route";
}

const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-bg-sunken text-ink-muted border-line",
  delivered: "bg-ok/15 text-ok border-ok/30",
  revised:   "bg-gold/15 text-gold border-gold/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

export default async function GuardianRoutesListPage({
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

  const { data: routes } = await sb!
    .from("routes")
    .select("id, order_id, route_type, status, title_ko, title_en, title_th, title_vi, updated_at")
    .eq("guardian_user_id", user!.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  const rows = routes ?? [];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{t("routesTitle")}</h1>
          <p className="text-sm text-ink-muted">{t("routesLead")}</p>
        </div>
        <Button asChild className="rounded-[var(--radius-md)] bg-accent-ksm text-white hover:bg-accent-dark">
          <Link href="/guardian/routes/new">{t("routesNewBtn")}</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-line bg-bg-card p-8 text-center space-y-3">
          <p className="font-semibold text-ink">{t("routesEmpty")}</p>
          <p className="text-sm text-ink-muted">{t("routesEmptyLead")}</p>
          <Button asChild variant="outline" className="rounded-[var(--radius-md)] border-line">
            <Link href="/guardian/matches">{t("routesViewMatches")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const title = pickTitle(r, locale);
            const statusStyle = STATUS_STYLES[r.status] ?? STATUS_STYLES.draft;
            return (
              <li key={r.id}>
                <div className="rounded-[var(--radius-xl)] border border-line bg-bg-card p-4 shadow-[var(--shadow-sm)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate font-semibold text-ink">{title}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}>
                          {r.status}
                        </span>
                        <span className="text-xs text-ink-soft uppercase">{r.route_type}</span>
                        {r.order_id && (
                          <span className="font-mono text-[10px] text-ink-whisper">
                            booking {String(r.order_id).slice(0, 8)}…
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {r.order_id && (
                        <Button asChild variant="outline" size="sm" className="rounded-[var(--radius-md)] border-line text-ink-muted">
                          <Link href={`/guardian/orders/${r.order_id}`}>{t("routesOrderWorkspace")}</Link>
                        </Button>
                      )}
                      <Button asChild size="sm" className="rounded-[var(--radius-md)] bg-accent-ksm text-white hover:bg-accent-dark">
                        <Link href={`/routes/${r.id}`}>{t("routesViewTimeline")} →</Link>
                      </Button>
                    </div>
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
