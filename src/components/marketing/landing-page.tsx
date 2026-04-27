/**
 * M01 — Landing (Traveler)
 * v6 KSM 메인 랜딩 페이지
 * Foundation §4.3 · SCREEN_SPECS_3A §M01
 */
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

// ── Mock 데이터 ──────────────────────────────────────────────────────────────

const MOCK_GUARDIANS = [
  {
    id: "g1",
    name: "Linh Nguyen",
    origin: "Vietnam → Seoul 5yr",
    languages: ["vi", "ko", "en"],
    emoji: "🇻🇳",
    rating: 4.9,
    reviews: 23,
    tagline: "Seongsu & Hongdae local",
  },
  {
    id: "g2",
    name: "Aom Siriporn",
    origin: "Thailand → Seoul 3yr",
    languages: ["th", "en", "ko"],
    emoji: "🇹🇭",
    rating: 5.0,
    reviews: 17,
    tagline: "K-drama spots expert",
  },
  {
    id: "g3",
    name: "Minh Tran",
    origin: "Vietnam → Seoul 7yr",
    languages: ["vi", "en", "ko"],
    emoji: "🇻🇳",
    rating: 4.8,
    reviews: 31,
    tagline: "Food & local market guide",
  },
];

const TIERS = [
  { key: "basic",    price: "₩29,000", days: "1-day",         featured: false },
  { key: "standard", price: "₩59,000", days: "3-day",         featured: true  },
  { key: "premium",  price: "₩119,000", days: "Up to 7-day",  featured: false },
];

// ── 미니 타임라인 히어로 목업 ─────────────────────────────────────────────────

function MiniTimeline() {
  const spots = [
    { n: 1, emoji: "☕", name: "Onion Seongsu",      time: "09:00", color: "bg-accent-soft" },
    { n: 2, emoji: "🌿", name: "Seoul Forest",        time: "10:20", color: "bg-bg-sunken"  },
    { n: 3, emoji: "🌊", name: "Hangang Park",        time: "12:00", color: "bg-bg-sunken"  },
    { n: 4, emoji: "🛍️", name: "Apgujeong Rodeo",    time: "14:30", color: "bg-accent-soft" },
  ];

  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-[var(--radius-xl)] border border-line bg-bg-card shadow-[var(--shadow-md)] p-4"
    >
      {/* 헤더 바 */}
      <div className="mb-3 flex items-center gap-2">
        <div className="size-2 rounded-full bg-accent-ksm" />
        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          Seongsu Day Route
        </span>
        <span className="ml-auto text-[10px] text-ink-soft">6h · ₩60,000</span>
      </div>

      {/* 가로 타임라인 */}
      <div className="flex items-center gap-0 overflow-x-auto pb-2 [scrollbar-width:none]">
        {spots.map((s, i) => (
          <div key={s.n} className="flex items-center">
            {/* 스팟 카드 */}
            <div className={`flex shrink-0 flex-col gap-1 rounded-[var(--radius-md)] ${s.color} p-2.5 w-28`}>
              <div className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-bg">
                  {s.n}
                </span>
                <span className="text-[10px] text-ink-muted tabular-nums">{s.time}</span>
              </div>
              <span className="text-lg leading-none">{s.emoji}</span>
              <span className="text-[11px] font-medium text-ink leading-tight line-clamp-2">{s.name}</span>
            </div>
            {/* 커넥터 */}
            {i < spots.length - 1 && (
              <div className="flex shrink-0 flex-col items-center w-10">
                <div className="h-px w-full border-t-2 border-dashed border-line" />
                <span className="text-[9px] text-ink-soft mt-0.5">🚶12m</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 가디언 서명 */}
      <div className="mt-3 flex items-center gap-2 border-t border-line-whisper pt-2.5">
        <div className="flex size-6 items-center justify-center rounded-full bg-ink text-xs text-bg font-semibold">M</div>
        <span className="text-[11px] text-ink-muted">Curated by <strong className="text-ink">Minh · Seoul Tribe</strong></span>
      </div>
    </div>
  );
}

// ── Page Component ────────────────────────────────────────────────────────────

export function LandingPage() {
  const t = useTranslations("Landing");

  return (
    <div className="min-h-screen bg-bg">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-bg">
        {/* 배경 텍스처 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 90% 10%, color-mix(in srgb, var(--accent-ksm) 12%, transparent), transparent 55%), radial-gradient(ellipse 60% 50% at 10% 90%, color-mix(in srgb, var(--gold) 10%, transparent), transparent 50%)",
          }}
        />

        <div className="page-container relative z-10 grid grid-cols-1 gap-12 py-20 md:grid-cols-2 md:items-center md:gap-16 md:py-28 lg:py-32">
          {/* 왼쪽: 카피 */}
          <div className="flex flex-col gap-6">
            {/* 상단 뱃지 */}
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-bg-card px-3 py-1.5 text-xs font-medium text-ink-muted">
              🇰🇷 Seoul · C2C Route Platform
            </span>

            <h1 className="font-serif text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
              {t("hero_headline")}
            </h1>

            <p className="text-lg text-ink-muted leading-relaxed max-w-md">
              {t("hero_subline")}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("hero_cta_primary")} →
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-line bg-bg-card px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/20"
              >
                {t("hero_cta_secondary")}
              </Link>
            </div>

            {/* 언어 전환 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-soft">Available in:</span>
              <LanguageSwitcher />
            </div>
          </div>

          {/* 오른쪽: 미니 타임라인 목업 */}
          <div className="flex items-center justify-center md:justify-end">
            <div className="w-full max-w-sm">
              <MiniTimeline />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="border-y border-line bg-bg-card">
        <div className="page-container py-10">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-ink-soft mb-6">
            {t("trust_title")}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { stat: "50+", label: t("trust_guardian_count"), icon: "👤" },
              { stat: "4.9★", label: t("trust_avg_rating"),    icon: "⭐" },
              { stat: "7",   label: t("trust_language_count"), icon: "🌏" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5 rounded-[var(--radius-lg)] bg-bg p-5">
                <span className="text-2xl" aria-hidden>{item.icon}</span>
                <span className="font-serif text-3xl font-semibold text-ink">{item.stat}</span>
                <span className="text-xs text-ink-muted text-center">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS TEASER ── */}
      <section className="page-container py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
            {t("how_title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { n: "01", icon: "👤", title: t("how_step1_title"), desc: t("how_step1_desc") },
            { n: "02", icon: "📝", title: t("how_step2_title"), desc: t("how_step2_desc") },
            { n: "03", icon: "🗺️", title: t("how_step3_title"), desc: t("how_step3_desc") },
          ].map((step) => (
            <div
              key={step.n}
              className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-line-soft bg-bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="font-serif text-4xl font-bold text-line">{step.n}</span>
                <span className="text-3xl">{step.icon}</span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-ink">{step.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent-ksm hover:text-accent-dark transition-colors"
          >
            {t("how_cta")} →
          </Link>
        </div>
      </section>

      {/* ── GUARDIAN SHOWCASE ── */}
      <section className="bg-bg-sunken py-16 md:py-20">
        <div className="page-container">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
              {t("guardians_title")}
            </h2>
            <Link
              href="/explore"
              className="hidden text-sm font-semibold text-accent-ksm hover:text-accent-dark sm:block"
            >
              {t("guardians_cta")} →
            </Link>
          </div>

          {/* 가디언 카드 수평 스크롤 */}
          <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] snap-x">
            {MOCK_GUARDIANS.map((g) => (
              <div
                key={g.id}
                className="flex shrink-0 snap-start flex-col gap-3 rounded-[var(--radius-xl)] border border-line bg-bg-card p-5 w-64"
              >
                {/* 아바타 */}
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-full bg-ink text-2xl">
                    {g.emoji}
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm leading-tight">{g.name}</p>
                    <p className="text-[11px] text-ink-muted">{g.origin}</p>
                  </div>
                </div>

                {/* 언어 뱃지 */}
                <div className="flex gap-1.5 flex-wrap">
                  {g.languages.map((l) => (
                    <span key={l} className="rounded-full bg-bg-sunken px-2 py-0.5 text-[10px] font-semibold text-ink-muted uppercase">
                      {l}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-ink-muted italic">&ldquo;{g.tagline}&rdquo;</p>

                {/* 평점 */}
                <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-line-whisper">
                  <span className="text-xs font-bold text-ink">{g.rating}★</span>
                  <span className="text-[10px] text-ink-soft">({g.reviews} reviews)</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link href="/explore" className="text-sm font-semibold text-accent-ksm">
              {t("guardians_cta")} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section className="page-container py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
            {t("pricing_title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
          {TIERS.map((tier) => (
            <div
              key={tier.key}
              className={[
                "relative flex flex-col gap-4 rounded-[var(--radius-xl)] p-6 border transition-shadow",
                tier.featured
                  ? "bg-bg-dark border-bg-dark text-bg shadow-[var(--shadow-md)]"
                  : "bg-bg-card border-line",
              ].join(" ")}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-ksm px-3 py-1 text-[10px] font-semibold text-white">
                  ✦ Most Popular
                </span>
              )}
              <p className={`text-xs font-semibold uppercase tracking-wider ${tier.featured ? "text-bg/60" : "text-ink-muted"}`}>
                {tier.key.charAt(0).toUpperCase() + tier.key.slice(1)}
              </p>
              <p className={`font-serif text-3xl font-bold ${tier.featured ? "text-bg" : "text-ink"}`}>
                {tier.price}
              </p>
              <p className={`text-sm ${tier.featured ? "text-bg/70" : "text-ink-muted"}`}>
                {tier.days}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent-ksm hover:text-accent-dark"
          >
            {t("pricing_cta")} →
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-bg-dark">
        <div className="page-container py-16 md:py-20 text-center flex flex-col gap-6 items-center">
          <h2 className="font-serif text-3xl font-semibold text-bg sm:text-4xl max-w-lg">
            {t("final_cta_traveler")}
          </h2>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-md)] hover:bg-accent-dark transition-colors"
          >
            Browse Guardians →
          </Link>
          <p className="text-bg/50 text-sm">
            {t("final_cta_guardian")}{" "}
            <Link href="/for-guardians" className="text-bg/80 underline underline-offset-2 hover:text-bg">
              {t("final_cta_guardian_link")}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
