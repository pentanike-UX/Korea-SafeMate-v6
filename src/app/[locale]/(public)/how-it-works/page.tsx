/**
 * M04 — How It Works
 * IA §4.3 M04 · 릴리즈 [M]
 * SCREEN_SPECS_3A §M04
 */
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("HowItWorks");
  return {
    title: `${t("hero_title")} — ${BRAND.name}`,
    description: "Step-by-step guide for travelers and Seoul Tribe Guardians.",
  };
}

function HowItWorksContent() {
  const t = useTranslations("HowItWorks");

  const travelerSteps = [
    { n: "01", icon: "🔍", title: t("step1_title"), desc: t("step1_desc") },
    { n: "02", icon: "📝", title: t("step2_title"), desc: t("step2_desc") },
    { n: "03", icon: "⏳", title: t("step3_title"), desc: t("step3_desc") },
    { n: "04", icon: "🗺️", title: t("step4_title"), desc: t("step4_desc") },
    { n: "05", icon: "📱", title: t("step5_title"), desc: t("step5_desc") },
  ];

  const guardianSteps = [
    { n: "01", icon: "✍️", title: t("g_step1_title"), desc: t("g_step1_desc") },
    { n: "02", icon: "✅", title: t("g_step2_title"), desc: t("g_step2_desc") },
    { n: "03", icon: "🗺️", title: t("g_step3_title"), desc: t("g_step3_desc") },
    { n: "04", icon: "💰", title: t("g_step4_title"), desc: t("g_step4_desc") },
  ];

  const trustItems = [
    { icon: "🔒", text: t("trust_payment") },
    { icon: "🛡️", text: t("trust_privacy") },
    { icon: "✨", text: t("trust_quality") },
    { icon: "↩️", text: t("trust_refund") },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* ── 페이지 헤더 ── */}
      <section className="border-b border-line bg-bg-card">
        <div className="page-container py-16 md:py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft">
            Korea SafeMate
          </p>
          <h1 className="font-serif text-4xl font-semibold text-ink sm:text-5xl">
            {t("hero_title")}
          </h1>
        </div>
      </section>

      {/* ── FOR TRAVELERS ── */}
      <section className="page-container py-16 md:py-20">
        <div className="mb-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-bg-card px-3 py-1 text-xs font-semibold text-ink-muted">
            ✈️ For Travelers
          </span>
          <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
            {t("traveler_title")}
          </h2>
        </div>

        <div className="flex flex-col gap-0">
          {travelerSteps.map((step, i) => (
            <div key={step.n} className="flex gap-6 group">
              {/* 왼쪽: 번호 + 세로선 */}
              <div className="flex flex-col items-center">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-bg">
                  {step.n}
                </div>
                {i < travelerSteps.length - 1 && (
                  <div className="mt-1 h-full w-px bg-line-soft flex-1 min-h-8" />
                )}
              </div>

              {/* 오른쪽: 내용 */}
              <div className={`flex flex-col gap-1.5 pb-8 ${i === travelerSteps.length - 1 ? "pb-0" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{step.icon}</span>
                  <h3 className="font-serif text-lg font-semibold text-ink">{step.title}</h3>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed max-w-lg">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST ITEMS ── */}
      <section className="bg-bg-sunken py-12 md:py-14">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-2xl mx-auto">
            {trustItems.map((item) => (
              <div key={item.text} className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-line bg-bg-card px-4 py-3.5">
                <span className="text-xl leading-none mt-0.5">{item.icon}</span>
                <p className="text-sm text-ink leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR GUARDIANS ── */}
      <section className="page-container py-16 md:py-20">
        <div className="mb-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-bg-card px-3 py-1 text-xs font-semibold text-ink-muted">
            🇰🇷 For Seoul Tribe Guardians
          </span>
          <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
            {t("guardian_title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 max-w-4xl">
          {guardianSteps.map((step) => (
            <div
              key={step.n}
              className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-line-soft bg-bg-card p-5"
            >
              <div className="flex items-center gap-2">
                <span className="font-serif text-3xl font-bold text-line">{step.n}</span>
                <span className="text-2xl">{step.icon}</span>
              </div>
              <h3 className="font-serif text-base font-semibold text-ink">{step.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bg-bg-dark">
        <div className="page-container py-14 md:py-16 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:bg-accent-dark hover:scale-[1.02]"
          >
            {t("bottom_cta_traveler")} →
          </Link>
          <Link
            href="/for-guardians"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-bg/80 transition-colors hover:bg-white/15"
          >
            {t("bottom_cta_guardian")} →
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
