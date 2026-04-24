"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { ContentCategory, ExploreSortMode, Region } from "@/types/domain";
import type { ExploreInsight } from "@/lib/explore-utils";
import {
  filterInsightsByCategory,
  filterInsightsByRegion,
  sortInsights,
} from "@/lib/explore-utils";
import { ExploreInsightCard } from "@/components/explore/explore-insight-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  allInsights: ExploreInsight[];
  categories: ContentCategory[];
  /** When set, enables region filter chips (main Explore only). */
  regions?: Region[];
  showRegionOnCards?: boolean;
  showFeaturedRow?: boolean;
  sectionId?: string;
};

export function ExploreDiscoveryClient({
  allInsights,
  categories,
  regions,
  showRegionOnCards = true,
  showFeaturedRow = false,
  sectionId = "intel",
}: Props) {
  const t = useTranslations("ExploreDiscovery");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [regionSlug, setRegionSlug] = useState<string | null>(null);
  const [sort, setSort] = useState<ExploreSortMode>("recommended");

  const featuredPicks = useMemo(
    () => allInsights.filter((i) => i.post.featured).slice(0, 3),
    [allInsights],
  );

  const filtered = useMemo(() => {
    let list = allInsights;
    list = filterInsightsByCategory(list, categorySlug);
    if (regions) list = filterInsightsByRegion(list, regionSlug);
    return sortInsights(list, sort);
  }, [allInsights, categorySlug, regionSlug, regions, sort]);

  const sortOptions = [
    ["recommended", t("sortRecommended")] as const,
    ["latest", t("sortLatest")] as const,
    ["popular", t("sortPopular")] as const,
  ];

  return (
    <section id={sectionId} className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("sectionTitle")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("sectionLead")}
            {/* TODO(prod): Full-text search, facets, and saved filters. */}
          </p>
        </div>

        {showFeaturedRow && featuredPicks.length > 0 ? (
          <div>
            <p className="text-foreground text-xs font-semibold uppercase tracking-wide">
              {t("featuredPicks")}
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              {featuredPicks.map((insight) => (
                <ExploreInsightCard key={insight.post.id} insight={insight} showRegion={showRegionOnCards} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-foreground text-xs font-semibold uppercase tracking-wide">{t("category")}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={categorySlug === null ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setCategorySlug(null)}
              >
                {t("all")}
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  type="button"
                  size="sm"
                  variant={categorySlug === c.slug ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setCategorySlug(c.slug)}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </div>

          {regions ? (
            <div className="min-w-0 flex-1 space-y-3 lg:max-w-md">
              <p className="text-foreground text-xs font-semibold uppercase tracking-wide">{t("region")}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={regionSlug === null ? "secondary" : "outline"}
                  className="rounded-full"
                  onClick={() => setRegionSlug(null)}
                >
                  {t("allRegions")}
                </Button>
                {regions.map((r) => (
                  <Button
                    key={r.id}
                    type="button"
                    size="sm"
                    variant={regionSlug === r.slug ? "secondary" : "outline"}
                    className="rounded-full"
                    onClick={() => setRegionSlug(r.slug)}
                  >
                    {r.name_ko}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-foreground text-xs font-semibold uppercase tracking-wide">{t("sort")}</p>
          <div className="mt-2 inline-flex rounded-lg border bg-muted/30 p-1">
            {sortOptions.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  sort === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">{t("emptyFilters")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((insight) => (
            <ExploreInsightCard key={insight.post.id} insight={insight} showRegion={showRegionOnCards} />
          ))}
        </div>
      )}
    </section>
  );
}
