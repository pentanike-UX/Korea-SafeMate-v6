/**
 * M02 — Guardian Landing
 * IA §4.3 M02 · 릴리즈 [M][P]
 * Seoul Tribe 가디언 지원 랜딩 페이지
 * SCREEN_SPECS_3A §M02
 */
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("GuardianLanding");
  return {
    title: `Become a Guardian — ${BRAND.name}`,
    description: t("hero_subline"),
  };
}

// ── 수익 계산 (정적 tier 테이블) ──────────────────────────────────────────────

const TIER_PRICES = {
  basic: 29000,
  standard: 59000,
  premium: 119000,
};

const EARNINGS_SCENARIOS = [
  { routes: 3,  tier: "standard" as const, label: "3 routes/mo"  },
  { routes: 5,  tier: "standard" as const, label: "5 routes/mo"  },
  { routes: 10, tier: "standard" as const, label: "10 routes/mo" },
];

function GuardianLandingContent() {
  const t = useTranslations("GuardianLanding");

  const benefits = [
    { icon: "🗓️", titleKey: "b1_title" as const, descKey: "b1_desc" as const },
    { icon: "💰", titleKey: "b2_title" as const, descKey: "b2_desc" as const },
    { icon: "📍", titleKey: "b3_title" as const, descKey: "b3_desc" as const },
  ];

  const foundingPerks = [
    "founding_f1" as const,
    "founding_f2" as const,
    "founding_f3" as const,
    "founding_f4" as const,
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-bg-dark">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 60% at 15% 50%, color-mix(in srgb, var(--accent-ksm) 30%, transparent), transparent 55%)",
          }}
        />

        <div className="page-container relative z-10 py-24 md:py-32">
          <div className="max-w-2xl">
            {/* 뱃지 */}
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-bg/80">
              🇰🇷 Seoul Tribe · Founding Members Open
            </span>

            <h1 className="mb-4 font-serif text-4xl font-semibold leading-[1.1] text-bg sm:text-5xl lg:text-6xl">
              {t("hero_headline")}
            </h1>

            <p className="mb-8 text-lg text-bg/70 leading-relaxed max-w-lg">
              {t("hero_subline")}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/guardians/apply"
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("cta_button")} →
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-bg/80 transition-colors hover:bg-white/15"
              >
                How it works
              </Link>
            </div>

            <p className="mt-4 text-xs text-bg/40">{t("cta_review_time")}</p>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="page-container py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
            {t("benefits_title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.titleKey}
              className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-line-soft bg-bg-card p-6"
            >
              <span className="text-4xl">{b.icon}</span>
              <h3 className="font-serif text-lg font-semibold text-ink">{t(b.titleKey)}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{t(b.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── EARNINGS SIMULATOR (정적) ── */}
      <section className="bg-bg-sunken py-16 md:py-20">
        <div className="page-container">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-2 font-serif text-3xl font-semibold text-ink sm:text-4xl">
              {t("earnings_title")}
            </h2>
            <p className="mb-8 text-sm text-ink-muted">{t("earnings_disclaimer")}</p>

            {/* 수익 카드 그리드 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {EARNINGS_SCENARIOS.map(({ routes, tier, label }) => {
                const gross = TIER_PRICES[tier] * routes;
                const net = Math.round(gross * 0.8);
                return (
                  <div
                    key={label}
                    className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-line bg-bg-card p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">{label}</p>
                    <p className="font-serif text-2xl font-bold text-ink">
                      ₩{net.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      {routes} × ₩{TIER_PRICES[tier].toLocaleString()} × 80%
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 하이라이트 */}
            <div className="mt-6 rounded-[var(--radius-xl)] border border-accent-soft bg-accent-soft/40 px-5 py-4 text-center">
              <p className="font-semibold text-ink text-sm">{t("earnings_highlight")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUNDING MEMBER ── */}
      <section className="page-container py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start gap-4 mb-6">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl mb-2">
                {t("founding_title")}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                🏅 {t("founding_remaining")}
              </span>
            </div>
          </div>

          <ul className="flex flex-col gap-3 mb-8">
            {foundingPerks.map((key) => (
              <li key={key} className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-line-soft bg-bg-card px-4 py-3.5">
                <span className="mt-px text-ok text-base leading-none">✓</span>
                <span className="text-sm text-ink leading-relaxed">{t(key)}</span>
              </li>
            ))}
          </ul>

          {/* 뱃지 CTA */}
          <div className="rounded-[var(--radius-xl)] border border-accent-ksm/30 bg-accent-soft/30 px-6 py-5 text-center">
            <p className="mb-4 text-sm font-semibold text-ink">{t("founding_badge")}</p>
            <Link
              href="/guardians/apply"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-7 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98]"
            >
              {t("cta_button")} →
            </Link>
            <p className="mt-3 text-xs text-ink-soft">{t("cta_review_time")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function GuardianLandingPage() {
  return <GuardianLandingContent />;
}
