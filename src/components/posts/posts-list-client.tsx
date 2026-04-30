"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { ContentCategory } from "@/types/domain";
import type { ContentPost } from "@/types/domain";
import { getPostHeroImageAlt, getPostHeroImageUrl, postHasRouteJourney } from "@/lib/content-post-route";
import { postListCardCoverClass } from "@/lib/post-image-crop";
import { cn } from "@/lib/utils";
import { ExplorationFilterSummaryBar, type ExplorationSummaryChip } from "@/components/listing/exploration-filter-summary-bar";
import { StickyListingFiltersBar } from "@/components/listing/sticky-listing-filters-bar";
import { SubpageHero } from "@/components/layout/subpage-hero";
import { PostSampleBadge } from "@/components/posts/post-sample-badge";
import { RoutePostCard } from "@/components/route-posts/route-post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Image from "next/image";
import { ArrowDownWideNarrow, FileQuestion, Heart, Layers, MapPin, Search, Sparkles, Tag } from "lucide-react";

const REGION_SLUGS = ["all", "seoul", "busan", "jeju"] as const;
type RegionFilter = (typeof REGION_SLUGS)[number];

const SORTS = ["recommended", "popular", "latest"] as const;
type SortMode = (typeof SORTS)[number];

const CONTENT_FILTERS = ["all", "article", "route"] as const;
type ContentFilter = (typeof CONTENT_FILTERS)[number];

export function PostsListClient({
  posts,
  categories,
}: {
  posts: ContentPost[];
  categories: ContentCategory[];
}) {
  const t = useTranslations("Posts");
  const tExplore = useTranslations("ListingExploration");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [region, setRegion] = useState<RegionFilter>("all");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [desktopFilterDrawer, setDesktopFilterDrawer] = useState(false);

  useEffect(() => {
    const c = searchParams.get("content");
    if (c === "route") setContentFilter("route");
    else if (c === "article") setContentFilter("article");
  }, [searchParams]);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktopFilterDrawer(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  const hasActiveFilters =
    q.trim().length > 0 ||
    category !== "all" ||
    region !== "all" ||
    sort !== "recommended" ||
    contentFilter !== "all";

  const resetFilters = () => {
    setQ("");
    setCategory("all");
    setRegion("all");
    setSort("recommended");
    setContentFilter("all");
  };

  const pickCategory = (slug: string) => {
    setCategory((prev) => (prev === slug && slug !== "all" ? "all" : slug));
  };

  const pickRegion = (r: RegionFilter) => {
    setRegion((prev) => (prev === r && r !== "all" ? "all" : r));
  };

  const pickContent = (f: ContentFilter) => {
    setContentFilter((prev) => (prev === f && f !== "all" ? "all" : f));
  };

  const filtered = useMemo(() => {
    let list = [...posts];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.summary.toLowerCase().includes(s) ||
          p.tags.some((tag) => tag.toLowerCase().includes(s)),
      );
    }
    if (category !== "all") {
      list = list.filter((p) => p.category_slug === category);
    }
    if (region !== "all") {
      list = list.filter((p) => p.region_slug === region);
    }
    if (contentFilter === "article") {
      list = list.filter((p) => !postHasRouteJourney(p));
    } else if (contentFilter === "route") {
      list = list.filter((p) => postHasRouteJourney(p));
    }
    if (sort === "popular") {
      list.sort((a, b) => b.popular_score - a.popular_score);
    } else if (sort === "latest") {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      list.sort((a, b) => b.recommended_score - a.recommended_score);
    }
    return list;
  }, [posts, q, category, region, sort, contentFilter]);

  const summaryChips = useMemo((): ExplorationSummaryChip[] => {
    const chips: ExplorationSummaryChip[] = [];
    const qt = q.trim();
    if (qt) {
      const short = qt.length > 20 ? `${qt.slice(0, 20)}…` : qt;
      chips.push({
        id: "q",
        label: t("chipSearch", { q: short }),
        onClear: () => setQ(""),
      });
    }
    if (category !== "all") {
      const cat = categories.find((c) => c.slug === category);
      chips.push({
        id: "category",
        label: t("chipCategory", { name: cat?.name ?? category }),
        onClear: () => setCategory("all"),
      });
    }
    if (region !== "all") {
      chips.push({
        id: "region",
        label: t("chipRegion", { name: t(`region.${region}` as "region.seoul") }),
        onClear: () => setRegion("all"),
      });
    }
    if (sort !== "recommended") {
      chips.push({
        id: "sort",
        label: t("chipSort", { name: t(`sort${sort.charAt(0).toUpperCase() + sort.slice(1)}` as "sortRecommended") }),
        onClear: () => setSort("recommended"),
      });
    }
    if (contentFilter !== "all") {
      chips.push({
        id: "content",
        label: t("chipContent", {
          name: t(`content${contentFilter.charAt(0).toUpperCase() + contentFilter.slice(1)}` as "contentAll"),
        }),
        onClear: () => setContentFilter("all"),
      });
    }
    return chips;
  }, [q, category, region, sort, contentFilter, categories, t]);

  const filterPanel = (
    <div className="flex flex-col gap-6 sm:gap-7">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2" aria-hidden />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-10 pl-11"
          aria-label={t("searchPlaceholder")}
        />
      </div>
      <div className="flex flex-col gap-6 sm:gap-7">
        <div className="min-w-0 space-y-2">
          <p className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase sm:text-xs">
            <Tag className="text-[var(--brand-trust-blue)] size-3.5 shrink-0" aria-hidden />
            {t("filterCategory")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={category === "all" ? "default" : "outline"}
              className="h-9 max-w-full whitespace-normal break-words rounded-full px-4 text-xs sm:text-sm"
              onClick={() => pickCategory("all")}
            >
              {t("all")}
            </Button>
            {categories.map((c) => (
              <Button
                key={c.slug}
                type="button"
                size="sm"
                variant={category === c.slug ? "default" : "outline"}
                className="h-9 max-w-full whitespace-normal break-words rounded-full px-4 text-xs sm:text-sm"
                onClick={() => pickCategory(c.slug)}
              >
                {c.name}
              </Button>
            ))}
          </div>
        </div>
        <div className="min-w-0 space-y-2 border-border/40 border-t pt-6 sm:pt-7">
          <p className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase sm:text-xs">
            <MapPin className="text-[var(--brand-trust-blue)] size-3.5 shrink-0" aria-hidden />
            {t("filterRegion")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {REGION_SLUGS.map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant={region === r ? "default" : "outline"}
                className="h-9 max-w-full whitespace-normal break-words rounded-full px-4 text-xs capitalize sm:text-sm"
                onClick={() => pickRegion(r)}
              >
                {r === "all" ? t("all") : t(`region.${r}` as "region.seoul")}
              </Button>
            ))}
          </div>
        </div>
        <div className="min-w-0 space-y-2 border-border/40 border-t pt-6 sm:pt-7">
          <p className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase sm:text-xs">
            <ArrowDownWideNarrow className="text-[var(--brand-trust-blue)] size-3.5 shrink-0" aria-hidden />
            {t("sort")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {SORTS.map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={sort === m ? "default" : "outline"}
                className="h-9 max-w-full whitespace-normal break-words rounded-full px-4 text-xs sm:text-sm"
                onClick={() => setSort((prev) => (prev === m && m !== "recommended" ? "recommended" : m))}
              >
                {t(`sort${m.charAt(0).toUpperCase() + m.slice(1)}` as "sortRecommended")}
              </Button>
            ))}
          </div>
        </div>
        <div className="min-w-0 space-y-2 border-border/40 border-t pt-6 sm:pt-7">
          <p className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase sm:text-xs">
            <Layers className="text-[var(--brand-trust-blue)] size-3.5 shrink-0" aria-hidden />
            {t("filterContent")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {CONTENT_FILTERS.map((f) => (
              <Button
                key={f}
                type="button"
                size="sm"
                variant={contentFilter === f ? "default" : "outline"}
                className="h-9 max-w-full whitespace-normal break-words rounded-full px-4 text-xs sm:text-sm"
                onClick={() => pickContent(f)}
              >
                {t(`content${f.charAt(0).toUpperCase() + f.slice(1)}` as "contentAll")}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[var(--bg-page)] min-h-screen">
      <SubpageHero
        title={t("heroTitle")}
        description={t("heroBody")}
        eyebrow={
          <p className="text-[var(--brand-trust-blue)] inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            하루
          </p>
        }
      />

      <StickyListingFiltersBar innerClassName="py-2 sm:py-2.5">
        <ExplorationFilterSummaryBar
          chips={summaryChips}
          allExploringLabel={t("explorationAll")}
          resultSummary={t("listResultsCount", { count: filtered.length })}
          resultSummaryShort={String(filtered.length)}
          showReset={hasActiveFilters}
          resetLabel={t("resetFilters")}
          onReset={resetFilters}
          openFiltersLabel={t("openFullFilters")}
          onOpenFilters={() => setFilterSheetOpen(true)}
          summaryAriaLabel={t("explorationSummaryAria")}
          chipClearLabel={(label) => tExplore("chipRemoveAria", { label })}
        />
      </StickyListingFiltersBar>

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent
          side={desktopFilterDrawer ? "right" : "bottom"}
          showCloseButton
          className={
            desktopFilterDrawer
              ? "h-dvh w-full max-w-[34rem] gap-0 overflow-hidden px-0 pt-0 pb-0 sm:max-w-[36rem]"
              : "max-h-[min(90dvh,720px)] gap-0 overflow-hidden rounded-t-2xl px-0 pt-0 pb-6 sm:max-h-[min(85dvh,800px)]"
          }
        >
          <SheetHeader className="border-border/60 shrink-0 space-y-1 border-b pt-4 pr-14 pb-3 pl-5 text-left sm:pt-5 sm:pr-16 sm:pb-4 sm:pl-6">
            <SheetTitle className="pr-1">{t("filterSheetTitle")}</SheetTitle>
            <p className="text-muted-foreground text-sm tabular-nums">{t("listResultsCount", { count: filtered.length })}</p>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">{filterPanel}</div>
          <SheetFooter className="border-border/60 shrink-0 border-t px-5 py-3 sm:px-6">
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="ghost" className="h-9 px-3 text-xs font-semibold sm:h-10 sm:px-4 sm:text-sm" onClick={resetFilters}>
                {t("resetFilters")}
              </Button>
              <Button type="button" variant="outline" className="h-9 px-3 text-xs font-semibold sm:h-10 sm:px-4 sm:text-sm" onClick={() => setFilterSheetOpen(false)}>
                {t("filterClose")}
              </Button>
              <Button type="button" className="h-9 px-4 text-xs font-semibold sm:h-10 sm:text-sm" onClick={() => setFilterSheetOpen(false)}>
                {t("filterApply")}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="w-full px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 xl:px-10">
        {filtered.length === 0 ? (
          <div className="border-border/60 text-muted-foreground flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-dashed bg-muted/20 px-6 py-20 text-center sm:py-24">
            <span className="text-[var(--brand-trust-blue)] flex size-14 items-center justify-center rounded-full bg-[var(--brand-trust-blue-soft)]">
              <FileQuestion className="size-7" strokeWidth={1.5} aria-hidden />
            </span>
            <p className="text-foreground max-w-sm text-base font-medium">{t("empty")}</p>
          </div>
        ) : (
          <ul className="grid justify-center gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17.5rem),26.25rem))] sm:gap-7 lg:gap-8">
            {filtered.map((p) => {
              const coverUrl = getPostHeroImageUrl(p);
              const coverAlt = getPostHeroImageAlt(p);
              return (
                <li key={p.id} className="w-full max-w-[420px]">
                  {postHasRouteJourney(p) ? (
                    <RoutePostCard
                      key={p.id}
                      post={p}
                      regionLabel={t(`region.${p.region_slug}` as "region.seoul")}
                    />
                  ) : (
                    <Link
                      href={`/posts/${p.id}`}
                      className="border-border/70 bg-card group flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border shadow-[var(--shadow-sm)] transition-all hover:border-[color-mix(in_srgb,var(--brand-trust-blue)_35%,var(--border))] hover:shadow-[var(--shadow-md)] active:scale-[0.99]"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                        <Image
                          src={coverUrl}
                          alt={coverAlt}
                          fill
                          className={cn(postListCardCoverClass(p), "transition-transform duration-500 group-hover:scale-[1.02]")}
                          sizes="(max-width:768px) 100vw, 33vw"
                        />
                        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[#0e1b3d]/45 to-transparent" />
                        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5">
                          {p.is_sample ? <PostSampleBadge variant="onImage" /> : null}
                          {p.featured ? (
                            <Badge className="rounded-full bg-card/95 text-[10px] font-semibold text-[var(--brand-primary)] shadow-sm backdrop-blur-sm">
                              {t("featured")}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                          <Tag className="text-[var(--brand-trust-blue)] size-3 shrink-0" aria-hidden />
                          {p.tags.slice(0, 3).join(" · ")}
                        </p>
                        <div className="mt-3 flex flex-wrap items-start gap-2 gap-y-1">
                          <h2 className="text-foreground line-clamp-2 min-w-0 flex-1 text-[17px] font-semibold leading-snug group-hover:text-[var(--link-color)] sm:text-lg">
                            {p.title}
                          </h2>
                          {p.is_sample ? <PostSampleBadge className="mt-0.5 sm:hidden" /> : null}
                        </div>
                        <p className="text-muted-foreground mt-3 line-clamp-2 flex-1 text-sm leading-relaxed sm:text-[15px]">{p.summary}</p>
                        <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            role="link"
                            tabIndex={0}
                            className="text-muted-foreground hover:text-foreground underline-offset-4 transition-colors hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/guardians/${p.author_user_id}`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return;
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/guardians/${p.author_user_id}`);
                            }}
                          >
                            {p.author_display_name}
                            <span aria-hidden className="mx-1.5 opacity-60">
                              ·
                            </span>
                            <span className="capitalize">{t(`region.${p.region_slug}` as "region.seoul")}</span>
                            {p.helpful_rating != null ? (
                              <>
                                <span aria-hidden className="mx-1.5 opacity-60">
                                  ·
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                  <Heart className="size-3.5 fill-rose-400/80 text-rose-400/80" aria-hidden />
                                  {p.helpful_rating.toFixed(1)}
                                </span>
                              </>
                            ) : null}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
