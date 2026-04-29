/**
 * M05 — Pricing
 * IA §4.3 M05 · 릴리즈 [M]
 * SCREEN_SPECS_3A §M05
 */
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("Pricing");
  return {
    title: `${t("hero_title")} — ${BRAND.name}`,
    description: t("hero_subtitle"),
  };
}

// ── Tier 구성 ─────────────────────────────────────────────────────────────────

type TierKey = "basic" | "standard" | "premium";

const TIERS: { key: TierKey; featured: boolean }[] = [
  { key: "basic",    featured: false },
  { key: "standard", featured: true  },
  { key: "premium",  featured: false },
];

// feature matrix: [basic, standard, premium]
const FEATURES = [
  { key: "feature_pre_chat" as const,    matrix: [true,  true,  true ] },
  { key: "feature_revision" as const,    matrix: [false, true,  true ] },
  { key: "feature_alt_course" as const,  matrix: [false, true,  true ] },
  { key: "feature_travel_chat" as const, matrix: [false, false, true ] },
  { key: "feature_voice_intro" as const, matrix: [false, false, true ] },
];

function PricingContent() {
  const t = useTranslations("Pricing");

  const faqs = [
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
  ];

  const tierTitleKeys = {
    basic:    "basic_title",
    standard: "standard_title",
    premium:  "premium_title",
  } as const;

  const tierPriceKeys = {
    basic:    "basic_price",
    standard: "standard_price",
    premium:  "premium_price",
  } as const;

  const tierDaysKeys = {
    basic:    "basic_days",
    standard: "standard_days",
    premium:  "premium_days",
  } as const;

  return (
    <div className="min-h-screen bg-bg">
      {/* ── 페이지 헤더 ── */}
      <section className="border-b border-line bg-bg-card">
        <div className="page-container py-16 md:py-20 text-center">
          <h1 className="mb-3 font-serif text-4xl font-semibold text-ink sm:text-5xl">
            {t("hero_title")}
          </h1>
          <p className="text-base text-ink-muted max-w-md mx-auto">
            {t("hero_subtitle")}
          </p>
        </div>
      </section>

      {/* ── 요금제 카드 ── */}
      <section className="page-container py-16 md:py-20">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          {TIERS.map(({ key, featured }) => (
            <div
              key={key}
              className={[
                "relative flex flex-col gap-5 rounded-[var(--radius-xl)] p-6 border",
                featured
                  ? "bg-bg-dark border-bg-dark shadow-[var(--shadow-lg)] scale-[1.02]"
                  : "bg-bg-card border-line",
              ].join(" ")}
            >
              {/* Most Popular 뱃지 */}
              {featured && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent-ksm px-4 py-1 text-[10px] font-bold text-white tracking-wide">
                  ✦ {t("standard_badge")}
                </span>
              )}

              {/* 가격 헤더 */}
              <div>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-widest ${featured ? "text-bg/50" : "text-ink-muted"}`}>
                  {t(tierTitleKeys[key])}
                </p>
                <p className={`font-serif text-4xl font-bold ${featured ? "text-bg" : "text-ink"}`}>
                  {t(tierPriceKeys[key])}
                </p>
                <p className={`mt-1 text-sm ${featured ? "text-bg/60" : "text-ink-muted"}`}>
                  {t(tierDaysKeys[key])}
                </p>
              </div>

              {/* 기능 목록 */}
              <ul className="flex flex-col gap-2 border-t pt-4 flex-1" style={{ borderColor: featured ? "rgba(255,255,255,0.12)" : undefined }}>
                {FEATURES.map(({ key: fKey, matrix }) => {
                  const tierIdx = key === "basic" ? 0 : key === "standard" ? 1 : 2;
                  const included = matrix[tierIdx];
                  return (
                    <li key={fKey} className="flex items-center gap-2.5">
                      <span className={`text-sm ${included ? (featured ? "text-ok" : "text-ok") : (featured ? "text-bg/20" : "text-ink-whisper")}`}>
                        {included ? "✓" : "–"}
                      </span>
                      <span className={`text-sm ${included ? (featured ? "text-bg/80" : "text-ink") : (featured ? "text-bg/30" : "text-ink-whisper")}`}>
                        {t(fKey)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* CTA */}
              <Link
                href="/explore"
                className={[
                  "mt-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]",
                  featured
                    ? "bg-accent-ksm text-white hover:bg-accent-dark"
                    : "border border-line bg-bg text-ink hover:border-ink/20",
                ].join(" ")}
              >
                {t("cta_request")} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-bg-sunken py-16 md:py-20">
        <div className="page-container max-w-2xl">
          <h2 className="mb-8 font-serif text-3xl font-semibold text-ink sm:text-4xl">
            {t("faq_title")}
          </h2>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-[var(--radius-xl)] border border-line bg-bg-card open:border-accent-ksm/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink text-sm">
                  {faq.q}
                  <span className="shrink-0 text-ink-muted transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <div className="border-t border-line px-5 py-4">
                  <p className="text-sm text-ink-muted leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="page-container py-12 text-center">
        <p className="mb-6 text-base text-ink-muted">{t("bottom_cta")}</p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-accent-dark hover:scale-[1.02]"
        >
          Browse 하루이 →
        </Link>
      </section>
    </div>
  );
}

export default function PricingPage() {
  return <PricingContent />;
}
