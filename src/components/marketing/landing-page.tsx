/**
 * M01 — Landing (Traveler)
 * 루트 중심 정보 구조 · 중복 최소화 · 로케일별 카피(next-intl).
 *
 * UX 원칙 (PRODUCT_SPEC §Landing):
 * - 5초 안에 "현지인이 만든 서울 하루 루트를 따라가는 서비스" 이해
 * - "하루" / "루트" / "그대로 따라간다" 3개가 UX 중심
 * - Guardian은 플랫폼이 아닌 루트 제작자로 포지셔닝
 * - Motion: 조용하고 고급스럽게 (scale ≤1.02, fade-up entrance)
 */
"use client";

import { Fragment, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { listPublicGuardians, type PublicGuardian } from "@/lib/guardian-public";
import {
  UserCheck,
  Map,
  Footprints,
  CheckCircle2,
  MapPin,
  Coffee,
  Trees,
  Waves,
  Sparkles,
  X,
} from "lucide-react";

const ROUTES_LIST_HREF = "/explore/routes";

type PricingCompareMark = "o" | "x" | "limited" | "unlimited";

const PRODUCTS = [
  {
    key: "basic",
    nameKey: "pricing_product_basic_name",
    descKey: "pricing_product_basic_desc",
    price: "₩29,000",
    featured: false,
    marks: ["o", "x", "x"] as const satisfies readonly PricingCompareMark[],
  },
  {
    key: "standard",
    nameKey: "pricing_product_standard_name",
    descKey: "pricing_product_standard_desc",
    price: "₩59,000",
    featured: true,
    marks: ["x", "o", "limited"] as const satisfies readonly PricingCompareMark[],
  },
  {
    key: "premium",
    nameKey: "pricing_product_premium_name",
    descKey: "pricing_product_premium_desc",
    price: "₩119,000",
    featured: false,
    marks: ["x", "o", "unlimited"] as const satisfies readonly PricingCompareMark[],
  },
] as const;

const PRICING_FEATURE_KEYS = ["pricing_feature_instant", "pricing_feature_personalize", "pricing_feature_consult"] as const;

function guardianInitials(displayName: string): string {
  const t = displayName.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]![0];
    const b = parts[parts.length - 1]![0];
    return `${a ?? ""}${b ?? ""}`.toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

const ROUTE_TAG_STYLE: Record<"route_tag_cafe" | "route_tag_walk" | "route_tag_river" | "route_tag_beginner", string> = {
  route_tag_cafe: "tag-route-cafe",
  route_tag_walk: "tag-route-walk",
  route_tag_river: "tag-route-river",
  route_tag_beginner: "tag-route-beginner",
};

function HeroHeadline({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </>
  );
}

function RoutePreviewCard() {
  const t = useTranslations("Landing");
  const timeline = [
    { Icon: Coffee, line: t("route_timeline_1"), time: "09:00" },
    { Icon: Trees, line: t("route_timeline_2"), time: "10:30" },
    { Icon: Waves, line: t("route_timeline_3"), time: "12:30" },
  ];
  const tags = ["route_tag_cafe", "route_tag_walk", "route_tag_river", "route_tag_beginner"] as const;
  const audienceTags = [t("route_audience_1"), t("route_audience_2"), t("route_audience_3")];
  const designerName = t("route_designer_display_name");

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-line bg-bg-card shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-md)]">
      {/* 카드 헤더 */}
      <div className="flex flex-col gap-1 border-b border-line-whisper px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="typo-h3 font-sans text-ink">{t("route_card_title")}</h3>
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink-muted">{t("route_card_meta")}</span>
        </div>
        {/* 루트 가치 설명 — "왜 이 루트인가" */}
        <p className="text-xs font-medium text-accent-ksm leading-snug">{t("route_card_diff")}</p>
      </div>

      {/* 분류 태그 */}
      <div className="space-y-2 px-4 pt-3 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((key) => (
            <span key={key} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${ROUTE_TAG_STYLE[key]}`}>
              {t(key)}
            </span>
          ))}
        </div>

        {/* 추천 대상 — secondary audience tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-medium text-ink-soft mr-0.5">{t("route_audience_label")}:</span>
          {audienceTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line-soft bg-bg-sunken px-2 py-0.5 text-[10px] font-medium text-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 타임라인 */}
      <div className="space-y-0 px-4 pb-3">
        {timeline.map((row, i) => (
          <div key={row.line} className="flex gap-3">
            <div className="flex w-12 shrink-0 flex-col items-center">
              <span className="text-[10px] font-semibold tabular-nums text-ink-muted">{row.time}</span>
              {i < timeline.length - 1 && (
                <div className="mt-1 flex-1 border-l-2 border-dashed border-line" style={{ minHeight: "28px" }} />
              )}
            </div>
            <div
              className={[
                "mb-2 flex min-h-[52px] flex-1 items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2",
                i === 0 ? "bg-accent-soft" : "bg-bg-sunken",
              ].join(" ")}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-ksm/10 text-accent-ksm">
                <row.Icon className="size-4" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-ink leading-tight">{row.line}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 카드 푸터 */}
      <div className="border-t border-line-whisper px-4 py-3 space-y-1.5">
        <p className="text-[10px] text-ink-soft">{t("route_movement_summary")}</p>
        <p className="text-[10px] text-ink-muted">
          {t("route_guardian_attribution", { name: designerName })}
        </p>
      </div>
    </div>
  );
}

export function LandingPage() {
  const t = useTranslations("Landing");
  const locale = useLocale();

  const problemItems = [t("problem_item1"), t("problem_item2"), t("problem_item3")];

  const howSteps = [
    { n: "01", Icon: Map, action: t("how_step1_action"), outcome: t("how_step1_outcome") },
    { n: "02", Icon: UserCheck, action: t("how_step2_action"), outcome: t("how_step2_outcome") },
    { n: "03", Icon: Footprints, action: t("how_step3_action"), outcome: t("how_step3_outcome") },
  ];

  const landingGuardians = useMemo(() => {
    const all = listPublicGuardians();
    const registered = all.filter((g) => g.approval_status === "approved" && g.matching_enabled);
    const source = registered.length > 0 ? registered : all;
    return [...source]
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return (b.avg_traveler_rating ?? 0) - (a.avg_traveler_rating ?? 0);
      })
      .slice(0, 3);
  }, []);

  const badge = t("hero_badge").trim();

  function representativeRouteTitle(guardian: PublicGuardian): string {
    const firstRoute = guardian.recommended_routes?.[0];
    if (!firstRoute) return guardian.headline;
    return locale === "ko" ? firstRoute.title.ko : firstRoute.title.en;
  }

  function pricingMarkLabel(mark: PricingCompareMark): string {
    switch (mark) {
      case "o":       return t("pricing_mark_o");
      case "x":       return t("pricing_mark_x");
      case "limited": return t("pricing_mark_limited");
      case "unlimited": return t("pricing_mark_unlimited");
      default:        return "";
    }
  }

  return (
    <div className="min-h-screen bg-bg">

      {/* ─────────────────────────────────────────────────────────────
          1. HERO
          ───────────────────────────────────────────────────────────── */}
      <section id="home-hero-root" data-header-contrast="light" className="hero hero-section">
        <div className="hero-bg" aria-hidden />
        <div className="hero-overlay" aria-hidden />
        <div className="page-container hero-main">
          <div className="hero-content flex flex-col gap-5 text-left md:gap-6">
            {badge.length > 0 ? (
              <span className="animate-fade-up inline-flex w-fit items-center gap-2 rounded-full border border-[var(--gray-200)] bg-white/90 px-3 py-1.5 text-xs font-medium text-[var(--gray-600)] shadow-[var(--shadow-card)] backdrop-blur-sm dark:border-[var(--gray-700)] dark:bg-[var(--gray-800)]/90 dark:text-[var(--gray-300)]">
                <MapPin className="size-3.5 shrink-0 text-accent-ksm" aria-hidden />
                {badge}
              </span>
            ) : null}

            <h1 className="animate-fade-up-delay-1 hero-headline typo-h1 font-sans">
              <HeroHeadline text={t("hero_headline")} />
            </h1>

            <p className="animate-fade-up-delay-2 hero-lead typo-body-lg hero-subline-max">{t("hero_subline")}</p>

            <div className="animate-fade-up-delay-3 hero-cta-row hero-cta-inline flex max-w-[min(320px,calc(100vw-48px))] flex-col gap-3 md:max-w-none md:flex-row md:items-center">
              <Link
                href="/explore/routes"
                className="hero-cta-primary inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-all duration-200 hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98] md:w-auto"
              >
                {t("hero_cta_primary")}
              </Link>
              <Link
                href="/how-it-works"
                className="hero-cta-secondary text-left text-sm font-medium underline underline-offset-4 decoration-[var(--gray-400)] transition-colors hover:decoration-[var(--gray-500)] md:text-center dark:decoration-[var(--gray-600)] dark:hover:decoration-[var(--gray-500)]"
              >
                {t("hero_cta_secondary")}
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-cta-mobile">
          <Link
            href="/explore/routes"
            className="hero-cta-primary hero-cta-mobile-primary inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-all duration-200 hover:bg-accent-dark active:scale-[0.98]"
          >
            {t("hero_cta_primary")}
          </Link>
          <Link
            href="/how-it-works"
            className="hero-cta-secondary hero-cta-mobile-secondary text-sm font-medium underline underline-offset-4 decoration-[var(--gray-400)] transition-colors hover:decoration-[var(--gray-500)] dark:decoration-[var(--gray-600)] dark:hover:decoration-[var(--gray-500)]"
          >
            {t("hero_cta_secondary")}
          </Link>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- 투명 PNG, 레이아웃 제어용 전경 오브젝트 */}
        <img
          className="hero-people"
          src="/images/hero/people.png"
          alt=""
          width={960}
          height={1080}
          decoding="async"
          fetchPriority="high"
        />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2+3. PROBLEM + ROUTE PREVIEW — 좌우 2컬럼 그루핑
               Hero 아래 여백 강화: py-20 md:py-28
          ───────────────────────────────────────────────────────────── */}
      <section className="page-container py-20 md:py-28">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">

          {/* 왼쪽: Problem */}
          <div className="flex flex-col gap-7">
            <h2 className="typo-h2 font-sans text-ink">{t("problem_title")}</h2>
            <ul className="space-y-2.5">
              {problemItems.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-line-soft bg-bg-card px-4 py-3.5 transition-shadow hover:shadow-[var(--shadow-sm)]"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <X className="size-3" strokeWidth={2.5} aria-hidden />
                  </span>
                  <p className="text-sm font-medium text-ink-muted">{item}</p>
                </li>
              ))}
            </ul>
            <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-accent-ksm/30 bg-accent-ksm/5 px-5 py-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent-ksm" strokeWidth={2} />
              <p className="text-sm font-semibold text-ink">{t("problem_bridge")}</p>
            </div>
          </div>

          {/* 오른쪽: Route Preview */}
          <div className="flex flex-col gap-4">
            <RoutePreviewCard />
            <Link
              href={ROUTES_LIST_HREF}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-bg-card px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-200 hover:bg-bg-sunken hover:border-ink/20 hover:scale-[1.01]"
            >
              {t("routes_cta_more")} →
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. HOW IT WORKS
             Problem↔How 사이 여백: bg-bg-sunken 자체가 구분자 역할
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-bg-sunken py-20 md:py-24">
        <div className="page-container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="typo-h2 font-sans text-ink">{t("how_title")}</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {howSteps.map((step) => (
              <div
                key={step.n}
                className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-line bg-bg-card p-6 transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <span className="font-sans text-4xl font-bold text-[var(--gray-300)]">{step.n}</span>
                  <div className="flex size-9 items-center justify-center rounded-full bg-accent-ksm/10 text-accent-ksm">
                    <step.Icon className="size-5" strokeWidth={1.75} />
                  </div>
                </div>
                <h3 className="typo-h3 font-sans text-ink">{step.action}</h3>
                <p className="text-sm font-medium text-accent-ksm leading-relaxed">{step.outcome}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ksm transition-colors hover:text-accent-dark"
            >
              {t("how_cta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. GUARDIANS — 루트 제작자로 포지셔닝
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <div className="page-container">
          <div className="mb-10 space-y-1.5">
            <h2 className="typo-h2 font-sans text-ink">{t("guardians_title")}</h2>
            <p className="text-sm text-ink-muted max-w-xl">{t("guardians_subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {landingGuardians.map((guardian) => {
              const name = guardian.display_name;
              const pick = guardian.headline;
              const repRoute = representativeRouteTitle(guardian);
              const tags = guardian.expertise_tags.slice(0, 2);
              const initials = guardianInitials(name);
              const rating = guardian.avg_traveler_rating ?? 4.7;
              const reviewCount = guardian.review_count_display ?? 0;
              const languages = guardian.languages.map((l) => l.language_code.toUpperCase());

              return (
                <div
                  key={guardian.user_id}
                  className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-line bg-bg-card p-6 transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
                >
                  <div className="flex gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-bg-sunken text-base font-bold text-ink">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-ink leading-tight">{name}</h3>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold tabular-nums text-ink">{rating}★</p>
                          <p className="text-[11px] text-ink-muted">{t("guardian_reviews_label", { count: reviewCount })}</p>
                        </div>
                      </div>
                      {/* headline: 가디언의 스타일/관점이 보이게 */}
                      <p className="mt-2 text-sm font-semibold text-accent-ksm leading-snug">{pick}</p>
                    </div>
                  </div>

                  <div className="border-t border-line-whisper pt-4 space-y-3 text-[11px]">
                    <div>
                      <p className="font-semibold uppercase tracking-wide text-ink-soft mb-1.5">{t("guardian_specialty_label")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((s) => (
                          <span key={s} className="rounded-full bg-bg-sunken px-2.5 py-0.5 font-medium text-ink-muted">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <p className="font-semibold uppercase tracking-wide text-ink-soft mb-0.5">{t("guardian_route_label")}</p>
                        <p className="text-sm font-semibold text-ink">{repRoute}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {languages.map((l) => (
                          <span key={l} className="rounded bg-bg-sunken px-1.5 py-0.5 text-[9px] font-bold text-ink-muted">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <Link href="/explore/routes" className="text-sm font-semibold text-accent-ksm transition-colors hover:text-accent-dark">
              {t("guardians_cta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. PRICING — 장벽 감소 강조, 상단 padding 증가
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-bg-sunken py-20 md:py-28">
        <div className="page-container">
          <div className="mx-auto max-w-xl text-center mb-4">
            <h2 className="typo-h2 font-sans text-ink">{t("pricing_title")}</h2>
          </div>
          {/* 장벽 감소 메시지 — 가격보다 먼저 */}
          <p className="mx-auto mb-10 max-w-sm text-center text-sm text-ink-muted">{t("pricing_value_lead")}</p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 max-w-3xl mx-auto">
            {PRODUCTS.map((product) => (
              <div
                key={product.key}
                className={[
                  "relative flex flex-col gap-4 rounded-[var(--radius-xl)] p-6 border transition-all duration-200",
                  product.featured
                    ? "bg-bg-dark border-bg-dark text-bg shadow-[var(--shadow-md)] ring-2 ring-accent-ksm/35 hover:ring-accent-ksm/50 hover:shadow-[var(--shadow-lg,var(--shadow-md))]"
                    : "bg-bg-card border-line hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
                ].join(" ")}
              >
                {product.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-accent-ksm px-3 py-1 text-[10px] font-semibold text-white whitespace-nowrap">
                    <Sparkles className="size-3" aria-hidden />
                    {t("pricing_featured_badge")}
                  </span>
                )}

                <p className={`text-xs font-semibold uppercase tracking-wider ${product.featured ? "text-bg/60" : "text-ink-muted"}`}>
                  {t(product.nameKey)}
                </p>

                <p className={`font-sans text-3xl font-bold ${product.featured ? "text-bg" : "text-ink"}`}>
                  {product.price}
                </p>

                <p className={`text-sm leading-relaxed ${product.featured ? "text-bg/70" : "text-ink-muted"}`}>
                  {t(product.descKey)}
                </p>

                <ul className={`mt-1 space-y-2 border-t pt-4 text-xs ${product.featured ? "border-white/15" : "border-line-whisper"}`}>
                  {product.marks.map((mark, i) => (
                    <li
                      key={PRICING_FEATURE_KEYS[i]}
                      className={`flex justify-between gap-3 ${product.featured ? "text-bg/75" : "text-ink-muted"}`}
                    >
                      <span>{t(PRICING_FEATURE_KEYS[i])}</span>
                      <span className={`shrink-0 font-semibold tabular-nums ${product.featured ? "text-bg" : "text-ink"}`}>
                        {pricingMarkLabel(mark)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ksm transition-colors hover:text-accent-dark"
            >
              {t("pricing_cta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FINAL CTA
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-bg-dark">
        <div className="page-container py-16 md:py-20 text-center flex flex-col gap-5 items-center">
          <h2 className="typo-h2 font-sans max-w-lg text-bg">
            {t("final_cta_traveler")}
          </h2>
          <Link
            href="/explore/routes"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all duration-200 hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98]"
          >
            {t("hero_cta_primary")}
          </Link>
          <p className="text-bg/50 text-sm">
            {t("final_cta_guardian")}{" "}
            <Link
              href="/for-guardians"
              className="text-bg/80 underline underline-offset-2 transition-colors hover:text-bg"
            >
              {t("final_cta_guardian_link")}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
