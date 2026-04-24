import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Region } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

type Props = { regions: Region[] };

export async function RegionGridCards({ regions }: Props) {
  const t = await getTranslations("Explore");
  const sorted = [...regions].sort((a, b) => {
    if (a.phase !== b.phase) return a.phase - b.phase;
    return a.name.localeCompare(b.name);
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("regionSectionTitle")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("regionSectionLead")}
            {/* TODO(prod): `regions` from Supabase with `phase` and geo bounds. */}
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((r) => (
          <Card
            key={r.id}
            className="border-primary/10 transition-all hover:border-primary/25 hover:shadow-md"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                    <MapPin className="size-4" aria-hidden />
                  </span>
                  <div>
                    <CardTitle className="text-lg leading-tight">{r.name}</CardTitle>
                    <CardDescription className="text-xs">{r.name_ko}</CardDescription>
                  </div>
                </div>
                <Badge variant={r.phase === 1 ? "default" : "secondary"} className="shrink-0">
                  {t("phase", { n: r.phase })}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{r.short_description}</p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild className="rounded-xl">
                <Link href={`/explore/${r.slug}`}>{t("openHub")}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/explore/${r.slug}#intel`}>{t("jumpToIntel")}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
