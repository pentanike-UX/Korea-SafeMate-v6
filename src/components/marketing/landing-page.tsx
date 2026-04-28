/**
 * M01 — Landing (Traveler)
 * 루트 중심 정보 구조 · 중복 최소화 · 로케일별 카피(next-intl).
 */
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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

const ROUTE_SAMPLE_GUARDIAN_ID = "mg03";

type MockSpec = "linh" | "aom" | "minh";

const MOCK_GUARDIAN_ROWS: {
  spec: MockSpec;
  rating: number;
  reviews: number;
  languages: string[];
}[] = [
  { spec: "linh", rating: 4.9, reviews: 23, languages: ["VI", "KO", "EN"] },
  { spec: "aom", rating: 5.0, reviews: 17, languages: ["TH", "EN", "KO"] },
  { spec: "minh", rating: 4.8, reviews: 31, languages: ["VI", "EN", "KO"] },
];

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

/** 한글 등 단일 문자열 이름: 시각 강조용 2글자 */
function avatarGlyph(displayName: string): string {
  const s = displayName.trim();
  if (!s) return "?";
  if (/[\u3131-\u318E\uAC00-\uD7A3]/.test(s) && s.length >= 2) return s.slice(-2);
  return guardianInitials(s);
}

const ROUTE_TAG_STYLE: Record<"route_tag_cafe" | "route_tag_walk" | "route_tag_river" | "route_tag_beginner", string> = {
  route_tag_cafe: "tag-route-cafe",
  route_tag_walk: "tag-route-walk",
  route_tag_river: "tag-route-river",
  route_tag_beginner: "tag-route-beginner",
};

function RoutePreviewCard() {
  const t = useTranslations("Landing");
  const timeline = [
    { Icon: Coffee, line: t("route_timeline_1"), time: "09:00" },
    { Icon: Trees, line: t("route_timeline_2"), time: "10:30" },
    { Icon: Waves, line: t("route_timeline_3"), time: "12:30" },
  ];
  const tags = ["route_tag_cafe", "route_tag_walk", "route_tag_river", "route_tag_beginner"] as const;
  const designerName = t("route_designer_display_name");
  const glyph = avatarGlyph(designerName);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-line bg-bg-card shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-1 border-b border-line-whisper px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="typo-h3 font-sans text-ink">{t("route_card_title")}</h3>
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink-muted">{t("route_card_meta")}</span>
        </div>
        <p className="text-xs font-medium text-accent-ksm leading-snug">{t("route_card_diff")}</p>
      </div>

      <div className="space-y-2 px-4 pt-3 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((key) => (
            <span key={key} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${ROUTE_TAG_STYLE[key]}`}>
              {t(key)}
            </span>
          ))}
        </div>
      </div>

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

      <div className="border-t border-line-whisper px-4 py-3 space-y-3">
        <p className="text-[10px] text-ink-soft">{t("route_movement_summary")}</p>

        <Link
          href={`/guardians/${ROUTE_SAMPLE_GUARDIAN_ID}`}
          className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-line-soft bg-bg-sunken p-3 text-left transition-colors hover:bg-bg-card hover:border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ksm"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-ksm/15 text-sm font-bold text-accent-ksm ring-2 ring-accent-ksm/20">
            {glyph}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink leading-tight">{designerName}</p>
            <p className="mt-0.5 text-[11px] text-ink-muted leading-snug">{t("route_sample_guardian_tagline")}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function LandingPage() {
  const t = useTranslations("Landing");

  const problemItems = [t("problem_item1"), t("problem_item2"), t("problem_item3")];

  const howSteps = [
    { n: "01", Icon: Map, action: t("how_step1_action"), outcome: t("how_step1_outcome") },
    { n: "02", Icon: UserCheck, action: t("how_step2_action"), outcome: t("how_step2_outcome") },
    { n: "03", Icon: Footprints, action: t("how_step3_action"), outcome: t("how_step3_outcome") },
  ];

  const trustLines = [t("trust_line_1"), t("trust_line_2"), t("trust_line_3")];

  const badge = t("hero_badge").trim();

  function pricingMarkLabel(mark: PricingCompareMark): string {
    switch (mark) {
      case "o":
        return t("pricing_mark_o");
      case "x":
        return t("pricing_mark_x");
      case "limited":
        return t("pricing_mark_limited");
      case "unlimited":
        return t("pricing_mark_unlimited");
      default:
        return "";
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* 1. HERO — 배경(bg) + 오버레이 + 콘텐츠 + 전경 인물(people), 우측 기준 absolute */}
      <section className="hero">
        <div className="hero-bg" aria-hidden />
        <div className="hero-overlay" aria-hidden />
        <div className="page-container">
          <div className="hero-content flex flex-col gap-6">
            {badge.length > 0 ? (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--gray-200)] bg-white/90 px-3 py-1.5 text-xs font-medium text-[var(--gray-600)] shadow-[var(--shadow-card)] backdrop-blur-sm dark:border-[var(--gray-700)] dark:bg-[var(--gray-800)]/90 dark:text-[var(--gray-300)]">
                <MapPin className="size-3.5 shrink-0 text-accent-ksm" aria-hidden />
                {badge}
              </span>
            ) : null}

            <h1 className="typo-h1 font-sans">{t("hero_headline")}</h1>

            <p className="hero-lead typo-body-lg max-w-md">{t("hero_subline")}</p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-all hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("hero_cta_primary")}
              </Link>
              <Link
                href="/how-it-works"
                className="hero-cta-secondary text-sm font-medium underline underline-offset-4 decoration-[var(--gray-400)] hover:decoration-[var(--gray-500)] dark:decoration-[var(--gray-600)] dark:hover:decoration-[var(--gray-500)]"
              >
                {t("hero_cta_secondary")}
              </Link>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- 투명 PNG, 레이아웃 제어용 전경 오브젝트 */}
          <img
            className="hero-person"
            src="/images/hero/people.png"
            alt=""
            width={960}
            height={1080}
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </section>

      {/* 2. PROBLEM */}
      <section className="page-container py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="typo-h2 font-sans text-ink mb-8">{t("problem_title")}</h2>

          <ul className="space-y-3 mb-8">
            {problemItems.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-line-soft bg-bg-card px-4 py-3.5"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <X className="size-3" strokeWidth={2.5} aria-hidden />
                </span>
                <p className="text-sm text-ink-muted">{item}</p>
              </li>
            ))}
          </ul>

          <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-accent-ksm/30 bg-accent-ksm/5 px-5 py-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent-ksm" strokeWidth={2} />
            <p className="text-sm font-semibold text-ink">{t("problem_bridge")}</p>
          </div>
        </div>
      </section>

      {/* 3. ROUTE SAMPLE */}
      <section className="page-container py-16 md:py-20">
        <div className="mx-auto max-w-lg">
          <h2 className="typo-h2 font-sans text-center mb-8 text-ink">{t("route_section_title")}</h2>
          <RoutePreviewCard />
          <div className="mt-8 rounded-[var(--radius-lg)] border border-line-soft bg-bg-sunken px-4 py-4 text-center">
            <p className="text-sm font-semibold text-ink leading-relaxed">{t("route_bridge_line2")}</p>
          </div>
        </div>
      </section>

      {/* 4. SOCIAL PROOF */}
      <section className="border-y border-line bg-bg-card">
        <div className="page-container py-8">
          <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-ink-soft mb-5">
            {t("trust_title")}
          </p>
          <ul className="mx-auto max-w-3xl space-y-3">
            {trustLines.map((line) => (
              <li
                key={line}
                className="rounded-[var(--radius-lg)] border border-line-soft bg-bg px-4 py-3 text-sm text-ink-muted leading-relaxed text-center"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. HOW */}
      <section className="bg-bg-sunken py-16 md:py-20">
        <div className="page-container">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="typo-h2 font-sans text-ink">{t("how_title")}</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {howSteps.map((step) => (
              <div
                key={step.n}
                className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-line bg-bg-card p-6"
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

          <div className="mt-8 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ksm hover:text-accent-dark transition-colors"
            >
              {t("how_cta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* 6. GUARDIANS */}
      <section className="py-16 md:py-20">
        <div className="page-container">
          <div className="mb-8 space-y-1">
            <h2 className="typo-h2 font-sans text-ink">{t("guardians_title")}</h2>
            <p className="text-sm text-ink-muted max-w-xl">{t("guardians_subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_GUARDIAN_ROWS.map((row) => {
              const spec = row.spec;
              const name = t(`landing_mock_${spec}_name`);
              const pick = t(`landing_mock_${spec}_pick`);
              const repRoute = t(`landing_mock_${spec}_rep_route`);
              const tag1 = t(`landing_mock_${spec}_tag1`);
              const tag2 = t(`landing_mock_${spec}_tag2`);
              const initials = guardianInitials(name);

              return (
                <div
                  key={spec}
                  className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-line bg-bg-card p-6 hover:shadow-[var(--shadow-sm)] transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-bg-sunken text-base font-bold text-ink">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-ink leading-tight">{name}</h3>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold tabular-nums text-ink">{row.rating}★</p>
                          <p className="text-[11px] text-ink-muted">{t("guardian_reviews_label", { count: row.reviews })}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-accent-ksm leading-snug">{pick}</p>
                    </div>
                  </div>

                  <div className="border-t border-line-whisper pt-4 space-y-3 text-[11px]">
                    <div>
                      <p className="font-semibold uppercase tracking-wide text-ink-soft mb-1.5">{t("guardian_specialty_label")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[tag1, tag2].map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-bg-sunken px-2.5 py-0.5 font-medium text-ink-muted"
                          >
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
                        {row.languages.map((l) => (
                          <span
                            key={l}
                            className="rounded bg-bg-sunken px-1.5 py-0.5 text-[9px] font-bold text-ink-muted"
                          >
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

          <div className="mt-8 flex justify-center">
            <Link href="/explore" className="text-sm font-semibold text-accent-ksm hover:text-accent-dark">
              {t("guardians_cta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* 7. PRICING */}
      <section className="bg-bg-sunken py-16 md:py-20">
        <div className="page-container">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="typo-h2 font-sans text-ink">{t("pricing_title")}</h2>
            <p className="mt-2 text-sm text-ink-muted">{t("pricing_lead")}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 max-w-3xl mx-auto">
            {PRODUCTS.map((product) => (
              <div
                key={product.key}
                className={[
                  "relative flex flex-col gap-4 rounded-[var(--radius-xl)] p-6 border transition-shadow",
                  product.featured
                    ? "bg-bg-dark border-bg-dark text-bg shadow-[var(--shadow-md)] ring-2 ring-accent-ksm/35"
                    : "bg-bg-card border-line",
                ].join(" ")}
              >
                {product.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-accent-ksm px-3 py-1 text-[10px] font-semibold text-white whitespace-nowrap">
                    <Sparkles className="size-3" aria-hidden />
                    {t("pricing_featured_badge")}
                  </span>
                )}

                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    product.featured ? "text-bg/60" : "text-ink-muted"
                  }`}
                >
                  {t(product.nameKey)}
                </p>

                <p className={`font-sans text-3xl font-bold ${product.featured ? "text-bg" : "text-ink"}`}>
                  {product.price}
                </p>

                <p className={`text-sm leading-relaxed ${product.featured ? "text-bg/70" : "text-ink-muted"}`}>
                  {t(product.descKey)}
                </p>

                <ul
                  className={`mt-1 space-y-2 border-t pt-4 text-xs ${product.featured ? "border-white/15" : "border-line-whisper"}`}
                >
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

          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ksm hover:text-accent-dark transition-colors"
            >
              {t("pricing_cta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="bg-bg-dark">
        <div className="page-container py-16 md:py-20 text-center flex flex-col gap-5 items-center">
          <h2 className="typo-h2 font-sans max-w-lg text-bg">
            {t("final_cta_traveler")}
          </h2>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-md)] hover:bg-accent-dark transition-colors"
          >
            {t("hero_cta_primary")}
          </Link>
          <p className="text-bg/50 text-sm">
            {t("final_cta_guardian")}{" "}
            <Link
              href="/for-guardians"
              className="text-bg/80 underline underline-offset-2 hover:text-bg transition-colors"
            >
              {t("final_cta_guardian_link")}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
