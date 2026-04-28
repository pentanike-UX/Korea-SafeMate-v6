/**
 * M01 — Landing (Traveler)
 * v6 KSM 메인 랜딩 페이지
 * Foundation §4.3 · SCREEN_SPECS_3A §M01
 *
 * UX (2026-04): 루트 중심 포지셔닝, 단일 Primary CTA, 섹션별 선택 이유,
 * Lucide 아이콘 통일, 로케일별 단일 언어 카피(next-intl).
 */
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  UserCheck,
  MessageSquare,
  Map,
  CheckCircle2,
  MapPin,
  Coffee,
  Trees,
  Waves,
  Sparkles,
  X,
} from "lucide-react";

/** 예시 루트의 설계자 프로필 — 성수·카페 시드(mg03)와 동선 예시를 맞춤 */
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

const PRODUCTS = [
  {
    key: "basic",
    nameKey: "pricing_product_basic_name",
    descKey: "pricing_product_basic_desc",
    price: "₩29,000",
    featured: false,
  },
  {
    key: "standard",
    nameKey: "pricing_product_standard_name",
    descKey: "pricing_product_standard_desc",
    price: "₩59,000",
    featured: true,
  },
  {
    key: "premium",
    nameKey: "pricing_product_premium_name",
    descKey: "pricing_product_premium_desc",
    price: "₩119,000",
    featured: false,
  },
] as const;

type PricingCompareMark = "o" | "x" | "limited" | "unlimited";

const PRICING_COMPARE_ROWS: {
  featureKey: "pricing_feature_instant" | "pricing_feature_personalize" | "pricing_feature_consult";
  marks: [PricingCompareMark, PricingCompareMark, PricingCompareMark];
}[] = [
  { featureKey: "pricing_feature_instant", marks: ["o", "x", "x"] },
  { featureKey: "pricing_feature_personalize", marks: ["x", "o", "o"] },
  { featureKey: "pricing_feature_consult", marks: ["x", "limited", "unlimited"] },
];

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

function RoutePreviewCard() {
  const t = useTranslations("Landing");
  const timeline = [
    { Icon: Coffee, line: t("route_timeline_1"), time: "09:00" },
    { Icon: Trees, line: t("route_timeline_2"), time: "10:30" },
    { Icon: Waves, line: t("route_timeline_3"), time: "12:30" },
  ];
  const tags = ["route_tag_cafe", "route_tag_walk", "route_tag_river", "route_tag_beginner"] as const;

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-line bg-bg-card shadow-[var(--shadow-md)]">
      <div className="flex flex-col gap-1 border-b border-line-whisper px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-base font-semibold text-ink leading-tight">{t("route_card_title")}</h3>
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink-muted">{t("route_card_meta")}</span>
        </div>
        <p className="text-xs font-medium text-accent-ksm leading-snug">{t("route_card_diff")}</p>
      </div>

      <div className="space-y-2 px-4 pt-3 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((key) => (
            <span
              key={key}
              className="rounded-full bg-accent-ksm/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent-ksm"
            >
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

      <div className="border-t border-line-whisper px-4 py-2.5">
        <p className="text-[10px] text-ink-soft">{t("route_movement_summary")}</p>
        <Link
          href={`/guardians/${ROUTE_SAMPLE_GUARDIAN_ID}`}
          className="mt-2 block text-left text-[11px] font-semibold text-ink underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ksm"
        >
          {t("route_guardian_attribution", { name: t("route_designer_name") })}
        </Link>
      </div>
    </div>
  );
}

function HeroVisual() {
  const t = useTranslations("Landing");
  const items = [
    { Icon: Coffee, label: t("route_tag_cafe") },
    { Icon: Trees, label: t("route_tag_walk") },
    { Icon: Waves, label: t("route_tag_river") },
  ];
  return (
    <div
      aria-hidden
      className="rounded-[var(--radius-xl)] border border-line bg-bg-card p-6 shadow-[var(--shadow-sm)]"
    >
      <div className="grid grid-cols-3 gap-3">
        {items.map(({ Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-accent-ksm/10 text-accent-ksm">
              <Icon className="size-5" strokeWidth={1.75} />
            </div>
            <span className="text-[10px] font-semibold text-ink-muted leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingPage() {
  const t = useTranslations("Landing");

  const problemItems = [t("problem_item1"), t("problem_item2"), t("problem_item3")];

  const howSteps = [
    { n: "01", Icon: UserCheck, action: t("how_step1_action"), outcome: t("how_step1_outcome") },
    { n: "02", Icon: MessageSquare, action: t("how_step2_action"), outcome: t("how_step2_outcome") },
    { n: "03", Icon: Map, action: t("how_step3_action"), outcome: t("how_step3_outcome") },
  ];

  const trustLines = [t("trust_line_1"), t("trust_line_2"), t("trust_line_3")];

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
      {/* 1. HERO */}
      <section className="relative overflow-hidden bg-bg">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 90% 10%, color-mix(in srgb, var(--accent-ksm) 12%, transparent), transparent 55%), radial-gradient(ellipse 60% 50% at 10% 90%, color-mix(in srgb, var(--gold) 10%, transparent), transparent 50%)",
          }}
        />

        <div className="page-container relative z-10 grid grid-cols-1 gap-12 py-20 md:grid-cols-2 md:items-center md:gap-16 md:py-28 lg:py-32">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-bg-card px-3 py-1.5 text-xs font-medium text-ink-muted">
              <MapPin className="size-3.5 shrink-0 text-accent-ksm" aria-hidden />
              {t("hero_badge")}
            </span>

            <h1 className="font-serif text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
              {t("hero_headline")}
            </h1>

            <p className="text-lg text-ink-muted leading-relaxed max-w-md">{t("hero_subline")}</p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("hero_cta_primary")}
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-ink transition-colors"
              >
                {t("hero_cta_secondary")}
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-end">
            <div className="w-full max-w-xs">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST */}
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

      {/* 3. PROBLEM */}
      <section className="page-container py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl mb-8">{t("problem_title")}</h2>

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

      {/* 4. HOW */}
      <section className="bg-bg-sunken py-16 md:py-20">
        <div className="page-container">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">{t("how_title")}</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {howSteps.map((step) => (
              <div
                key={step.n}
                className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-line bg-bg-card p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="font-serif text-4xl font-bold text-line">{step.n}</span>
                  <div className="flex size-9 items-center justify-center rounded-full bg-accent-ksm/10 text-accent-ksm">
                    <step.Icon className="size-5" strokeWidth={1.75} />
                  </div>
                </div>
                <h3 className="font-serif text-lg font-semibold text-ink">{step.action}</h3>
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

      {/* 5. ROUTE SAMPLE + GUARDIAN 브릿지 */}
      <section className="page-container py-16 md:py-20">
        <div className="mx-auto max-w-lg">
          <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl text-center mb-8">{t("route_section_title")}</h2>
          <RoutePreviewCard />
          <div className="mt-8 space-y-2 rounded-[var(--radius-lg)] border border-line-soft bg-bg-sunken px-4 py-4 text-center">
            <p className="text-sm text-ink leading-relaxed">{t("route_bridge_line1")}</p>
            <p className="text-sm font-semibold text-ink">{t("route_bridge_line2")}</p>
          </div>
        </div>
      </section>

      {/* 6. GUARDIANS */}
      <section className="bg-bg-sunken py-16 md:py-20">
        <div className="page-container">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">{t("guardians_title")}</h2>
              <p className="text-sm text-ink-muted max-w-xl">{t("guardians_subtitle")}</p>
            </div>
            <Link
              href="/explore"
              className="hidden text-sm font-semibold text-accent-ksm hover:text-accent-dark sm:block shrink-0"
            >
              {t("guardians_cta")} →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_GUARDIAN_ROWS.map((row) => {
              const spec = row.spec;
              const name = t(`landing_mock_${spec}_name`);
              const origin = t(`landing_mock_${spec}_origin`);
              const pick = t(`landing_mock_${spec}_pick`);
              const style = t(`landing_mock_${spec}_style`);
              const repRoute = t(`landing_mock_${spec}_rep_route`);
              const tag1 = t(`landing_mock_${spec}_tag1`);
              const tag2 = t(`landing_mock_${spec}_tag2`);
              const initials = guardianInitials(name);

              return (
                <div
                  key={spec}
                  className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-line bg-bg-card p-5 hover:shadow-[var(--shadow-sm)] transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-bg-sunken text-xs font-bold text-ink">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink text-sm leading-tight">{name}</p>
                      <p className="text-[11px] text-ink-muted">{origin}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm font-bold text-ink">{row.rating}★</p>
                      <p className="text-[10px] text-ink-soft">{t("guardian_reviews_label", { count: row.reviews })}</p>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-accent-ksm leading-snug">{pick}</p>

                  <p className="text-xs text-ink-muted italic leading-relaxed border-l-2 border-accent-ksm/40 pl-2.5">
                    {style}
                  </p>

                  <div>
                    <p className="text-[10px] font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                      {t("guardian_specialty_label")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[tag1, tag2].map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-bg-sunken px-2.5 py-0.5 text-[10px] font-semibold text-ink-muted"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-line-whisper pt-3">
                    <div>
                      <p className="text-[10px] font-semibold text-ink-soft uppercase tracking-wide">
                        {t("guardian_route_label")}
                      </p>
                      <p className="text-xs font-semibold text-ink">{repRoute}</p>
                    </div>
                    <div className="flex gap-1">
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
              );
            })}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link href="/explore" className="text-sm font-semibold text-accent-ksm">
              {t("guardians_cta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* 7. PRICING */}
      <section className="py-16 md:py-20">
        <div className="page-container">
          <div className="mx-auto max-w-2xl text-center mb-8">
            <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">{t("pricing_title")}</h2>
            <p className="mt-2 text-sm text-ink-muted">{t("pricing_lead")}</p>
          </div>

          <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-line mb-8 max-w-4xl mx-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-sunken">
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-ink">
                    {t("pricing_compare_feature_col")}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold text-ink">
                    {t("pricing_col_purchase")}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold text-ink">
                    {t("pricing_col_custom")}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold text-ink">
                    {t("pricing_col_premium")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {PRICING_COMPARE_ROWS.map((row) => (
                  <tr key={row.featureKey} className="border-b border-line-whisper last:border-0">
                    <th scope="row" className="px-4 py-3 text-left font-medium text-ink-muted">
                      {t(row.featureKey)}
                    </th>
                    {row.marks.map((mark, i) => (
                      <td key={i} className="px-3 py-3 text-center tabular-nums text-ink">
                        {pricingMarkLabel(mark)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
            {PRODUCTS.map((product) => (
              <div
                key={product.key}
                className={[
                  "relative flex flex-col gap-3 rounded-[var(--radius-xl)] p-6 border transition-shadow",
                  product.featured
                    ? "bg-bg-dark border-bg-dark text-bg shadow-[var(--shadow-md)]"
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

                <p className={`font-serif text-3xl font-bold ${product.featured ? "text-bg" : "text-ink"}`}>
                  {product.price}
                </p>

                <p
                  className={`text-sm leading-relaxed ${product.featured ? "text-bg/70" : "text-ink-muted"}`}
                >
                  {t(product.descKey)}
                </p>
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
          <h2 className="font-serif text-3xl font-semibold text-bg sm:text-4xl max-w-lg leading-tight">
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
