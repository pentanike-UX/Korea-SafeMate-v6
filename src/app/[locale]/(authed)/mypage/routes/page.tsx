import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";
import { listTravelerPurchasedRoutes } from "@/lib/routes/haru-route-from-supabase.server";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function TravelerMyRoutesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = localeParam || "en";
  const t = await getTranslations("TravelerHub");

  const travelerId = await getSupabaseAuthUserIdOnly();
  const sb = await getServerSupabaseForUser();
  const rows = travelerId && sb ? await listTravelerPurchasedRoutes(sb) : [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl">{t("myRoutesPageTitle")}</h2>
        <p className="text-muted-foreground mt-2 max-w-xl text-[15px] leading-relaxed">{t("myRoutesLead")}</p>
      </div>

      {rows.length === 0 ? (
        <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
          <CardHeader>
            <Map className="text-primary size-10" strokeWidth={1.5} aria-hidden />
            <CardTitle className="text-lg">{t("myRoutesEmptyTitle")}</CardTitle>
            <CardDescription>{t("myRoutesEmptyLead")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-xl font-semibold">
              <Link href="/explore">{t("ctaExplore")}</Link>
            </Button>
          </CardContent>
        </Card>
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
                    </div>
                    <span className="text-primary shrink-0 text-sm font-medium">{t("myRoutesOpen")}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
