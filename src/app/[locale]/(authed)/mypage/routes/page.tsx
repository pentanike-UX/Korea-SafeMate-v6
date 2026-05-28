import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";
import { listTravelerPurchasedRoutes } from "@/lib/routes/haru-route-from-supabase.server";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { MypageHubCard, MypageHubCardContent, MypageHubCardHeader } from "@/components/mypage/mypage-hub-card";
import { Map } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return { title: `${t("myRoutesPageTitle")} | ${BRAND.name}` };
}

function pickTitle(
  row: { title_ko: string | null; title_en: string | null; title_th: string | null; title_vi: string | null },
  locale: string,
): string {
  const v =
    locale === "ko"
      ? row.title_ko
      : locale === "th"
        ? row.title_th
        : locale === "vi"
          ? row.title_vi
          : row.title_en;
  return (v ?? row.title_en ?? row.title_ko ?? "Route").trim() || "Route";
}

function formatDateTime(iso: string | null, locale: string): string {
  if (!iso) return "-";
  const l = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : locale === "th" ? "th-TH" : "en-US";
  try {
    return new Intl.DateTimeFormat(l, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function TravelerMyRoutesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = localeParam || "en";
  const t = await getTranslations("TravelerHub");

  const travelerId = await getSupabaseAuthUserIdOnly();
  const sb = await getServerSupabaseForUser();
  const rows = travelerId && sb ? await listTravelerPurchasedRoutes(sb) : [];

  // 저장(북마크)한 루트
  type SavedRouteRow = {
    id: string;
    title_ko: string | null;
    title_en: string | null;
    title_th: string | null;
    title_vi: string | null;
    status: string;
  };
  let savedRows: SavedRouteRow[] = [];
  if (travelerId && sb) {
    const { data } = await sb
      .from("traveler_saved_routes")
      .select("route_id, created_at, routes(id, title_ko, title_en, title_th, title_vi, status)")
      .eq("traveler_user_id", travelerId)
      .order("created_at", { ascending: false });
    savedRows = (data ?? [])
      .map((r) => (Array.isArray(r.routes) ? r.routes[0] : r.routes) as SavedRouteRow | null)
      .filter((r): r is SavedRouteRow => Boolean(r));
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl">{t("myRoutesPageTitle")}</h2>
        <p className="text-muted-foreground mt-2 max-w-xl text-[15px] leading-relaxed">{t("myRoutesLead")}</p>
      </div>

      {rows.length === 0 ? (
        <MypageHubCard>
          <MypageHubCardHeader className="space-y-3">
            <Map className="text-primary size-10" strokeWidth={1.5} aria-hidden />
            <CardTitle className="text-lg">{t("myRoutesEmptyTitle")}</CardTitle>
            <CardDescription>{t("myRoutesEmptyLead")}</CardDescription>
          </MypageHubCardHeader>
          <MypageHubCardContent className="space-y-0">
            <Button asChild className="rounded-xl font-semibold">
              <Link href="/explore">{t("ctaExplore")}</Link>
            </Button>
          </MypageHubCardContent>
        </MypageHubCard>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const title = pickTitle(r, locale);
            return (
              <li key={r.id}>
                <Link
                  href={`/routes/${r.id}`}
                  className="block rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-sm)] transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{title}</p>
                      <p className="text-muted-foreground mt-1 text-xs capitalize">{r.status}</p>
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        <p>
                          {t("myRoutesDeliveredAtLabel")}: {formatDateTime(r.delivered_at, locale)}
                        </p>
                        <p>
                          {t("myRoutesRevisionLabel", { count: r.revision_count, max: r.max_revisions })} ·{" "}
                          {r.revision_requested_at
                            ? t("myRoutesRevisionPending")
                            : t("myRoutesRevisionReady")}
                        </p>
                      </div>
                    </div>
                    <span className="text-primary shrink-0 text-sm font-medium">{t("myRoutesOpen")}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {savedRows.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-text-strong text-base font-semibold tracking-tight">
            {locale === "ko" ? "저장한 루트" : "Saved routes"}
          </h3>
          <ul className="space-y-3">
            {savedRows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/routes/${r.id}`}
                  className="block rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-sm)] transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{pickTitle(r, locale)}</p>
                      <p className="text-muted-foreground mt-1 text-xs capitalize">{r.status}</p>
                    </div>
                    <span className="text-primary shrink-0 text-sm font-medium">{t("myRoutesOpen")}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
