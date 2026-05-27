import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";
import { loadTravelerActivityBundle } from "@/lib/traveler-activity-mypage.server";
import { TravelerActivityHub } from "@/components/mypage/traveler-activity-hub";
import { ChevronRight } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return { title: `${t("activityPageTitle")} | ${BRAND.name}` };
}

export default async function TravelerActivityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = (
    ["ko", "en", "ja", "th", "vi"].includes(localeParam) ? localeParam : "en"
  ) as "ko" | "en" | "ja" | "th" | "vi";
  const t = await getTranslations("TravelerHub");
  const bundle = await loadTravelerActivityBundle(locale);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest">
          {t("activityPageEyebrow")}
        </p>
        <h2 className="text-text-strong mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
          {t("activityPageTitle")}
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          {t("activityPageLead")}
        </p>
        <Link
          href="/explore/routes"
          className="text-[var(--brand-primary)] mt-3 inline-flex items-center gap-1 text-sm font-bold"
        >
          {t("routePassesEmptyCta")} <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </header>

      <TravelerActivityHub bundle={bundle} locale={locale} />
    </div>
  );
}
