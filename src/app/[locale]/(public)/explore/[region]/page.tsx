import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { mockContentCategories, mockRegions } from "@/data/mock";
import { listPublicGuardiansMerged } from "@/lib/guardian-public-merged.server";
import { listApprovedPostsMerged } from "@/lib/posts-public-merged.server";
import { enrichInsight } from "@/lib/explore-utils";
import { ExploreCtas } from "@/components/explore/explore-ctas";
import { ExploreDiscoveryClient } from "@/components/explore/explore-discovery-client";
import { ExploreRegionGuardians } from "@/components/explore/explore-region-guardians";
import { ExploreRegionHero } from "@/components/explore/explore-region-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/constants";
import { InlineTextLink } from "@/components/ui/text-action";

type Props = { params: Promise<{ locale: string; region: string }> };

export function generateStaticParams() {
  return mockRegions.map((r) => ({ region: r.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { region } = await params;
  const r = mockRegions.find((x) => x.slug === region);
  const t = await getTranslations("Explore");
  return {
    title: r ? `${r.name} · ${t("metaTitle")} | ${BRAND.name}` : `Region | ${BRAND.name}`,
  };
}

export default async function ExploreRegionPage({ params }: Props) {
  const { region } = await params;
  const t = await getTranslations("Explore");
  const meta = mockRegions.find((r) => r.slug === region);
  if (!meta) notFound();

  const [allPosts, allGuardians] = await Promise.all([listApprovedPostsMerged(), listPublicGuardiansMerged()]);
  const approved = allPosts.filter((p) => p.region_slug === region && p.status === "approved");

  const insights = approved.map((p) =>
    enrichInsight(p, mockRegions, mockContentCategories, allGuardians),
  );

  return (
    <>
      <ExploreRegionHero region={meta} />

      <ExploreRegionGuardians regionSlug={region} guardians={allGuardians} />

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Card className="border-primary/10 bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("regionHubTagsTitle")}</CardTitle>
            <CardDescription>{t("regionHubTagsLead")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {mockContentCategories.map((c) => (
              <Badge key={c.id} variant="outline" className="font-normal">
                {c.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </section>

      <ExploreDiscoveryClient
        allInsights={insights}
        categories={mockContentCategories}
        showRegionOnCards={false}
        showFeaturedRow
        sectionId="intel"
      />

      <ExploreCtas />

      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <InlineTextLink href="/explore" className="text-sm">
          {t("allRegions")}
        </InlineTextLink>
      </div>
    </>
  );
}
