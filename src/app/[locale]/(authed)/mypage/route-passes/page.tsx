import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";
import { listMyRoutePasses } from "@/lib/route-access-mypage.server";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Ticket, Users, ChevronRight } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return { title: `${t("routePassesPageTitle")} | ${BRAND.name}` };
}

const SOURCE_LABEL: Record<"single" | "trio" | "penta" | "admin-comp", string> = {
  single: "Single (₩990)",
  trio: "Trio pack",
  penta: "Penta pack",
  "admin-comp": "Comp (운영)",
};

export default async function RoutePassesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = (
    ["ko", "en", "ja", "th", "vi"].includes(localeParam) ? localeParam : "en"
  ) as "ko" | "en" | "ja" | "th" | "vi";
  const t = await getTranslations("TravelerHub");

  const { grants, packs } = await listMyRoutePasses(locale);

  const hasAny = grants.length + packs.length > 0;

  return (
    <main className="min-h-[100dvh] bg-bg px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 max-w-3xl">
        <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest">
          {t("routePassesPageEyebrow")}
        </p>
        <h1 className="text-foreground font-serif mt-1 text-2xl font-semibold sm:text-3xl">
          {t("routePassesPageTitle")}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {t("routePassesPageLead")}
        </p>
      </header>

      {!hasAny ? (
        <Card className="max-w-2xl border-border/60">
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-foreground text-sm font-semibold">{t("routePassesEmptyTitle")}</p>
            <p className="text-muted-foreground text-xs leading-relaxed">{t("routePassesEmptyBody")}</p>
            <Link
              href="/explore/routes"
              className="text-[var(--brand-primary)] hover:opacity-95 inline-flex items-center gap-1 text-sm font-bold"
            >
              {t("routePassesEmptyCta")} <ChevronRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {/* 활성 grant 목록 */}
      {grants.length > 0 ? (
        <section className="mb-8 max-w-3xl">
          <h2 className="text-foreground mb-3 text-sm font-bold">
            {t("routePassesActiveGrantsTitle", { n: grants.length })}
          </h2>
          <ul className="space-y-2">
            {grants.map((g) => (
              <li key={g.grant_id}>
                <Link
                  href={`/routes/${g.route_id}`}
                  className="border-border/60 bg-card hover:border-[var(--brand-primary)]/40 hover:shadow-[var(--shadow-md)] flex items-start gap-3 rounded-2xl border p-4 transition-all"
                >
                  <span className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Clock className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-bold">
                      {g.route_title ?? g.route_id}
                    </p>
                    <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                      <span>{SOURCE_LABEL[g.source]}</span>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">
                        {t("routePassesDaysRemaining", { d: g.days_remaining })}
                      </span>
                      {g.active_invite_count > 0 ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-3" aria-hidden />
                            {t("routePassesActiveInvites", { n: g.active_invite_count })}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground mt-1 size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 패키지 잔여 */}
      {packs.length > 0 ? (
        <section className="max-w-3xl">
          <h2 className="text-foreground mb-3 text-sm font-bold">
            {t("routePassesPacksTitle", { n: packs.length })}
          </h2>
          <ul className="space-y-2">
            {packs.map((p) => (
              <li
                key={p.pack_id}
                className="border-border/60 bg-card flex items-start gap-3 rounded-2xl border p-4"
              >
                <span className="bg-amber-400/15 text-amber-700 flex size-10 shrink-0 items-center justify-center rounded-xl dark:text-amber-300">
                  <Ticket className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-bold">
                    {p.pack_size === 3 ? "Trio pack" : "Penta pack"}
                  </p>
                  <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                    <span className="tabular-nums">
                      {t("routePassesPackRemaining", { n: p.tickets_remaining, total: p.pack_size })}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">
                      {t("routePassesDaysRemaining", { d: p.days_remaining })}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
