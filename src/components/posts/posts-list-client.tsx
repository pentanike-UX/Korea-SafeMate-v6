"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { ContentPost, ContentPostKind } from "@/types/domain";
import type { ContentCategory } from "@/types/domain";
import { getPostHeroImageAlt, getPostHeroImageUrl, postHasRouteJourney, getContentPostFormat } from "@/lib/content-post-route";
import { normalizeDisplayTags } from "@/lib/content-post-tags";
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
import { listCardActionButtonClass, listCardMetaBlockClass } from "@/components/ui/action-variants";
import Image from "next/image";
import {
  ArrowDownWideNarrow,
  FileQuestion,
  Heart,
  Layers,
  MapPin,
  Search,
  ShieldX,
  Sparkles,
  Tag,
} from "lucide-react";

const REGION_SLUGS = ["all", "seoul", "busan", "jeju"] as const;
type RegionFilter = (typeof REGION_SLUGS)[number];

const SORTS = ["recommended", "popular", "latest"] as const;
type SortMode = (typeof SORTS)[number];

const CONTENT_FILTERS = ["all", "article", "route"] as const;
type ContentFilter = (typeof CONTENT_FILTERS)[number];

/** 외국인 선호 테마 태그 — 포스트 tags[] 와 매칭 */
const THEME_TAGS = [
  { label: "#쇼핑", value: "쇼핑" },
  { label: "#사진", value: "사진" },
  { label: "#관광지", value: "관광지" },
  { label: "#사찰", value: "사찰" },
  { label: "#Kpop", value: "Kpop" },
  { label: "#전망대", value: "전망대" },
  { label: "#K뷰티", value: "K뷰티" },
  { label: "#카페", value: "카페" },
  { label: "#디저트", value: "디저트" },
  { label: "#가라오케", value: "가라오케" },
  { label: "#맛집", value: "맛집" },
  { label: "#산책", value: "산책" },
] as const;

// ── 아티클 카드 포맷 레이블 키 ─────────────────────────────────────────────
const KIND_TO_LABEL_KEY: Record<ContentPostKind, string> = {
  hot_place: "hotPlace",
  local_tip: "localGuide",
  food: "foodWalk",
  shopping: "shoppingWalk",
  k_content: "kContent",
  practical: "practicalTip",
};

function articleFormatLabelKey(post: ContentPost): string {
  const fmt = post.post_format ?? "article";
  if (fmt === "route") return "recommendedRoute";
  if (fmt === "hybrid") return "hybridGuide";
  if (fmt === "spot") return "spotGuide";
  return KIND_TO_LABEL_KEY[post.kind] ?? "article";
}

// ── 비루트 포스트 카드 (RoutePostCard와 동일 시각 언어) ────────────────────
function ArticlePostCard({ post, regionLabel }: { post: ContentPost; regionLabel: string }) {
  const t = useTranslations("Posts");
  const router = useRouter();
  const coverUrl = getPostHeroImageUrl(post);
  const coverAlt = getPostHeroImageAlt(post);
  const displayTags = normalizeDisplayTags(post.tags).slice(0, 3).join(" · ");
  const formatLabelKey = articleFormatLabelKey(post);
  const isBlocked = post.status === "blocked";

  if (isBlocked) {
    return (
      <div className="border-border/70 bg-card flex h-full flex-col overflow-hidden rounded-2xl border opacity-60 shadow-[var(--shadow-sm)]">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={coverUrl}
            alt={coverAlt}
            fill
            className={cn(postListCardCoverClass(post))}
            sizes="(max-width:768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1b3d]/60 via-transparent to-transparent" />
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
            <span className="flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur-sm">
              <ShieldX className="size-3.5" aria-hidden />
              차단된 게시물
            </span>
          </div>
        </div>
        <div className="px-4 pb-1 pt-4 sm:px-5 sm:pb-2 sm:pt-5">
          <p className="text-primary text-[11px] font-bold tracking-widest uppercase">{displayTags}</p>
          <h2 className="text-foreground mt-1.5 line-clamp-2 text-base font-bold leading-snug sm:mt-2 sm:text-lg">
            {post.title}
          </h2>
        </div>
        <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-1 sm:px-5 sm:pb-5 sm:pt-2">
          <div className={listCardMetaBlockClass}>
            <p className="capitalize">{regionLabel}</p>
          </div>
          <Button size="sm" disabled className={cn(listCardActionButtonClass, "mt-auto cursor-not-allowed")}>
            보러가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border/70 bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-md)]">
      <Link href={`/posts/${post.id}`} className="group block">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={coverUrl}
            alt={coverAlt}
            fill
            className={cn(
              postListCardCoverClass(post),
              "transition-transform duration-500 group-hover:scale-[1.02]",
            )}
            sizes="(max-width:768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1b3d]/60 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
            {post.is_sample ? <PostSampleBadge variant="onImage" /> : null}
            <Badge className="rounded-full bg-white/95 text-[10px] font-bold text-[var(--brand-primary)] shadow-sm">
              {t(`postTypeLabel.${formatLabelKey}` as "postTypeLabel.article")}
            </Badge>
            {post.featured ? (
              <Badge className="rounded-full bg-card/95 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
                {t("featured")}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="px-4 pb-1 pt-4 sm:px-5 sm:pb-2 sm:pt-5">
          <p className="text-primary text-[11px] font-bold tracking-widest uppercase">{displayTags}</p>
          <h2 className="text-foreground mt-1.5 line-clamp-2 text-base font-bold leading-snug group-hover:text-primary sm:mt-2 sm:text-lg">
            {post.title}
          </h2>
          <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-relaxed sm:mt-2">
            {post.summary}
          </p>
          <p className="text-muted-foreground mt-2 text-xs leading-snug">
            <span className="font-medium text-foreground/85 capitalize">{regionLabel}</span>
            {post.category_slug ? (
              <>
                <span aria-hidden className="mx-1 text-border">·</span>
                <span>{post.category_slug.replace(/-/g, " ")}</span>
              </>
            ) : null}
          </p>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-1 sm:px-5 sm:pb-5 sm:pt-2">
        <div className={listCardMetaBlockClass}>
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <button
              type="button"
              className="text-foreground/90 font-medium hover:underline underline-offset-4 transition-colors"
              onClick={() => router.push(`/guardians/${post.author_user_id}`)}
            >
              {post.author_display_name}
            </button>
            {post.helpful_rating != null ? (
              <>
                <span aria-hidden className="text-muted-foreground/60">·</span>
                <span className="inline-flex items-center gap-0.5">
                  <Heart className="size-3 fill-rose-400/80 text-rose-400/80" aria-hidden />
                  {post.helpful_rating.toFixed(1)}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <div className="mt-auto">
          <Button asChild size="sm" className={cn(listCardActionButtonClass, "w-full sm:w-auto")}>
            <Link href={`/posts/${post.id}`}>보러가기</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function PostsListClient({
  posts,
  categories,
}: {
  posts: ContentPost[];
  categories: ContentCategory[];
}) {
  const t = useTranslations("Posts");
  const tExplore = useTranslations("ListingExploration");
  const searchParams = useSearchParams();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [region, setRegion] = useState<RegionFilter>("all");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  /** 다중 선택 테마 태그 (OR 매칭) */
  const [themeTags, setThemeTags] = useState<string[]>([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [desktopFilterDrawer, setDesktopFilterDrawer] = useState(false);

  // URL params → initial state
  useEffect(() => {
    const c = searchParams.get("content");
    if (c === "route") setContentFilter("route");
    else if (c === "article") setContentFilter("article");
  }, [searchParams]);

  // 데스크톱 드로어 여부
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
    contentFilter !== "all" ||
    themeTags.length > 0;

  const resetFilters = () => {
    setQ("");
    setCategory("all");
    setRegion("all");
    setSort("recommended");
    setContentFilter("all");
    setThemeTags([]);
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
  /** 테마 태그 토글 (다중 선택) */
  const toggleThemeTag = (value: string) => {
    setThemeTags((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
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

    // 테마 태그: 선택된 태그 중 하나라도 포함하는 포스트 (OR 로직)
    if (themeTags.length > 0) {
      list = list.filter((p) =>
        themeTags.some((tag) =>
          p.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
        ),
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
  }, [posts, q, category, region, sort, contentFilter, themeTags]);

  const summaryChips = useMemo((): ExplorationSummaryChip[] => {
    const chips: ExplorationSummaryChip[] = [];
    const qt = q.trim();
    if (qt) {
      chips.push({
        id: "q",
        label: t("chipSearch", { q: qt.length > 20 ? `${qt.slice(0, 20)}…` : qt }),
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
        label: t("chipSort", {
          name: t(`sort${sort.charAt(0).toUpperCase() + sort.slice(1)}` as "sortRecommended"),
        }),
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
    // 다중 선택 테마 태그 — 태그별 개별 칩
    themeTags.forEach((tag) => {
      chips.push({
        id: `themeTag-${tag}`,
        label: `#${tag}`,
        onClear: () => setThemeTags((prev) => prev.filter((t) => t !== tag)),
      });
    });
    return chips;
  }, [q, category, region, sort, contentFilter, themeTags, categories, t]);

  // ── 필터 패널 공통 JSX ──────────────────────────────────────────────────────
  const filterPanel = (
    <div className="flex flex-col gap-6 sm:gap-7">
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2"
          aria-hidden
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-10 pl-11"
          aria-label={t("searchPlaceholder")}
        />
      </div>
      <div className="flex flex-col gap-6 sm:gap-7">
        {/* 주제 */}
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
        {/* 지역 */}
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
        {/* 정렬 */}
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
                onClick={() =>
                  setSort((prev) => (prev === m && m !== "recommended" ? "recommended" : m))
                }
              >
                {t(`sort${m.charAt(0).toUpperCase() + m.slice(1)}` as "sortRecommended")}
              </Button>
            ))}
          </div>
        </div>
        {/* 포맷 */}
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
    <div className="bg-[var(--bg-page)] min-h-[100dvh]">
      {/* ── 헤더 — explore/routes 문구로 통일 ─────────────────────────────── */}
      <SubpageHero
        title={t("heroTitle")}
        description={t("heroBody")}
        eyebrow={
          <p className="text-[var(--brand-trust-blue)] inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            {t("heroEyebrow")}
          </p>
        }
      />

      {/* ── 스티키 필터 바 ─────────────────────────────────────────────────── */}
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

      {/* ── 테마 태그 칩 바 — 다중 선택 / 즉시 필터 ──────────────────────── */}
      <div className="border-b border-border/30 bg-[var(--bg-page)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-2.5 sm:py-3">
            {THEME_TAGS.map(({ label, value }) => {
              const active = themeTags.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleThemeTag(value)}
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-150",
                    active
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-sm"
                      : "border-border/60 bg-background text-muted-foreground hover:border-[var(--brand-primary)]/50 hover:text-foreground",
                  )}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 필터 시트 ──────────────────────────────────────────────────────── */}
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
            <p className="text-muted-foreground text-sm tabular-nums">
              {t("listResultsCount", { count: filtered.length })}
            </p>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
            {filterPanel}
          </div>
          <SheetFooter className="border-border/60 shrink-0 border-t px-5 py-3 sm:px-6">
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-9 px-3 text-xs font-semibold sm:h-10 sm:px-4 sm:text-sm"
                onClick={resetFilters}
              >
                {t("resetFilters")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 px-3 text-xs font-semibold sm:h-10 sm:px-4 sm:text-sm"
                onClick={() => setFilterSheetOpen(false)}
              >
                {t("filterClose")}
              </Button>
              <Button
                type="button"
                className="h-9 px-4 text-xs font-semibold sm:h-10 sm:text-sm"
                onClick={() => setFilterSheetOpen(false)}
              >
                {t("filterApply")}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── 카드 그리드 ────────────────────────────────────────────────────── */}
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
            {filtered.map((p) => (
              <li key={p.id} className="w-full max-w-[420px]">
                {postHasRouteJourney(p) ? (
                  /* 루트 포스트 — 최신 RoutePostCard */
                  <RoutePostCard
                    post={p}
                    regionLabel={t(`region.${p.region_slug}` as "region.seoul")}
                  />
                ) : (
                  /* 아티클/팁 — RoutePostCard와 동일 시각 언어의 ArticlePostCard */
                  <ArticlePostCard
                    post={p}
                    regionLabel={t(`region.${p.region_slug}` as "region.seoul")}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
