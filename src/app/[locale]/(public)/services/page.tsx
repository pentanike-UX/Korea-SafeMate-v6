import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { mockServiceTypes } from "@/data/mock";
import { TrustBoundaryCard } from "@/components/trust/trust-boundary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRAND } from "@/lib/constants";
import type { ServiceTypeCode } from "@/types/domain";

export async function generateMetadata() {
  const t = await getTranslations("Services");
  return {
    title: `${t("metaTitle")} | ${BRAND.name}`,
    description: t("metaDescription"),
  };
}

function formatKrw(n: number, locale: string) {
  const tag = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("Services");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
          {t("intro")}
          {/* TODO(prod): Pull live pricing & availability from Supabase + admin config. */}
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {mockServiceTypes.map((s) => {
          const code = s.code as ServiceTypeCode;
          const bullets = t.raw(`cards.${code}.bullets`) as string[];
          return (
            <Card key={s.code} className="flex flex-col border-primary/10 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{t(`cards.${code}.title`)}</CardTitle>
                  <Badge variant="outline" className="shrink-0">
                    {t("durationBadge", { hours: s.duration_hours })}
                  </Badge>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {t(`cards.${code}.shortDescription`)}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-1 flex-col gap-4">
                <ul className="text-muted-foreground space-y-2 text-sm">
                  {bullets.map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
                <p className="text-foreground text-sm font-semibold">
                  {t("fromPrice", { price: formatKrw(s.base_price_krw, locale) })}
                </p>
                <Button asChild className="w-full rounded-xl sm:w-auto">
                  <Link href={`/book?service=${s.code}`}>{t("selectBook")}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-14">
        <TrustBoundaryCard />
      </div>
    </div>
  );
}
