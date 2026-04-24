import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Region } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Props = { region: Region };

export async function ExploreRegionHero({ region }: Props) {
  const t = await getTranslations("Explore");

  return (
    <section className="border-b bg-hero-mesh-subtle">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/explore"
          className="group/back text-muted-foreground hover:text-foreground mb-4 -ml-2 inline-flex items-center gap-1.5 border-b-2 border-transparent pb-0.5 text-sm font-medium transition-all duration-200 hover:border-border/70 hover:gap-2"
        >
          <ArrowLeft className="size-4 shrink-0 transition-transform duration-200 group-hover/back:-translate-x-0.5" aria-hidden />
          {t("backToExplore")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={region.phase === 1 ? "default" : "secondary"}>
            {t("phase", { n: region.phase })}
          </Badge>
          <span className="text-muted-foreground text-sm">{region.name_ko}</span>
        </div>
        <h1 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {region.name}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
          {region.short_description}
        </p>
        <p className="text-foreground mt-6 max-w-3xl text-sm leading-relaxed">{region.detail_blurb}</p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild className="rounded-xl">
            <Link href="/book">{t("bookInArea")}</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/guardians/apply">{t("contributeIntel")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
