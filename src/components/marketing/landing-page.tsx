/**
 * M01 — Landing (Traveler)
 * v6 KSM 메인 랜딩 페이지
 * Foundation §4.3 · SCREEN_SPECS_3A §M01
 *
 * UX 개선 이력 (2026-04):
 *  - 포지셔닝 단일화: "C2C Route Platform" 뱃지 제거
 *  - CTA 계층화: Primary 버튼 1개 + 텍스트 링크
 *  - MiniTimeline: 액션 레이블 + 경험 태그 + 개별 이동시간 제거
 *  - Problem 섹션 신설 (Pain-point → Bridge)
 *  - 섹션 흐름 재배치: Hook → Credibility → Problem → How → Guardians → Price → CTA
 *  - Guardian 카드: specialty + 대표 루트 추가
 *  - 가격 구조: SaaS 구독 → 상품 단위 (루트 단건 / 맞춤 설계 / 프리미엄)
 *  - How steps: Lucide 아이콘으로 통일
 */
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { UserCheck, MessageSquare, Map, CheckCircle2 } from "lucide-react";

// ── Mock 데이터 ──────────────────────────────────────────────────────────────

const MOCK_GUARDIANS = [
  {
    id: "g1",
    name: "Linh Nguyen",
    origin: "Vietnam → Seoul 5yr",
    languages: ["VI", "KO", "EN"],
    emoji: "🇻🇳",
    rating: 4.9,
    reviews: 23,
    tagline: "Seongsu & Hongdae local",
    specialty: ["감성 카페", "인스타 스팟"],
    repRoute: "Seongsu Local Day",
    style: "여유롭고 감성적인 서울 하루",
  },
  {
    id: "g2",
    name: "Aom Siriporn",
    origin: "Thailand → Seoul 3yr",
    languages: ["TH", "EN", "KO"],
    emoji: "🇹🇭",
    rating: 5.0,
    reviews: 17,
    tagline: "K-drama spots expert",
    specialty: ["K-드라마 촬영지", "성지순례"],
    repRoute: "K-Drama Seoul Trail",
    style: "드라마 속 그 장소, 직접 걷기",
  },
  {
    id: "g3",
    name: "Minh Tran",
    origin: "Vietnam → Seoul 7yr",
    languages: ["VI", "EN", "KO"],
    emoji: "🇻🇳",
    rating: 4.8,
    reviews: 31,
    tagline: "Food & local market guide",
    specialty: ["현지 맛집", "전통 시장"],
    repRoute: "Gwangjang Market Day",
    style: "현지인만 아는 진짜 서울 맛",
  },
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

// ── 미니 타임라인 ─────────────────────────────────────────────────────────────
// 개선: 액션 중심 레이블 + 경험 태그 + 개별 이동시간 제거 → 하단 총합으로 대체

const ROUTE_SPOTS = [
  { n: 1, icon: "☕", action: "브런치 시작", place: "Onion Seongsu",    time: "09:00", highlight: true  },
  { n: 2, icon: "🌿", action: "공원 산책",   place: "서울숲",            time: "10:30", highlight: false },
  { n: 3, icon: "🌊", action: "한강 휴식",   place: "한강공원",          time: "12:30", highlight: false },
  { n: 4, icon: "🛍️", action: "쇼핑 마무리", place: "압구정 로데오",     time: "14:30", highlight: true  },
];

const ROUTE_TAGS = ["Café", "Walk", "Hangang", "Beginner"];

function MiniTimeline() {
  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-[var(--radius-xl)] border border-line bg-bg-card shadow-[var(--shadow-md)]"
    >
      {/* 루트 헤더 */}
      <div className="flex items-center gap-2 border-b border-line-whisper px-4 py-3">
        <div className="size-2 rounded-full bg-accent-ksm" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
          Seongsu Local Day
        </span>
        <span className="ml-auto text-[10px] text-ink-soft">6h · ₩59,000</span>
      </div>

      {/* 루트 설명 + 태그 */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <p className="text-xs text-ink-muted">감성 카페 · 공원 산책 · 한강 휴식 루트</p>
        <div className="flex flex-wrap gap-1.5">
          {ROUTE_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent-ksm/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent-ksm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 타임라인 — 수직 스크롤 (데스크톱에서 4개 모두 표시) */}
      <div className="px-4 pb-3 space-y-0">
        {ROUTE_SPOTS.map((s, i) => (
          <div key={s.n} className="flex gap-3">
            {/* 시간 축 */}
            <div className="flex w-12 shrink-0 flex-col items-center">
              <span className="text-[10px] font-semibold tabular-nums text-ink-muted">{s.time}</span>
              {i < ROUTE_SPOTS.length - 1 && (
                <div className="mt-1 flex-1 border-l-2 border-dashed border-line" style={{ minHeight: "28px" }} />
              )}
            </div>

            {/* 스팟 내용 */}
            <div
              className={[
                "mb-2 flex min-h-[52px] flex-1 items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2",
                s.highlight ? "bg-accent-soft" : "bg-bg-sunken",
              ].join(" ")}
            >
              <span className="text-base leading-none">{s.icon}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-ink leading-tight">{s.action}</p>
                <p className="text-[10px] text-ink-muted truncate">{s.place}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 하단: 총 이동 시간 + 가디언 */}
      <div className="border-t border-line-whisper px-4 py-2.5 flex items-center justify-between gap-3">
        <span className="text-[10px] text-ink-soft">도보 이동 약 35분</span>
        <div className="flex items-center gap-1.5">
          <div className="flex size-5 items-center justify-center rounded-full bg-ink text-[10px] text-bg font-semibold">
            M
          </div>
          <span className="text-[10px] text-ink-muted">
            Curated by <strong className="text-ink">Minh</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page Component ────────────────────────────────────────────────────────────

export function LandingPage() {
  const t = useTranslations("Landing");

  const problemItems = [
    t("problem_item1"),
    t("problem_item2"),
    t("problem_item3"),
  ];

  const howSteps = [
    {
      n: "01",
      Icon: UserCheck,
      title: t("how_step1_title"),
      desc: t("how_step1_desc"),
    },
    {
      n: "02",
      Icon: MessageSquare,
      title: t("how_step2_title"),
      desc: t("how_step2_desc"),
    },
    {
      n: "03",
      Icon: Map,
      title: t("how_step3_title"),
      desc: t("how_step3_desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-bg">

      {/* ─────────────────────────────────────────────────────────────────────
          1. HERO
          ───────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-bg">
        {/* 배경 그라디언트 */}
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
            {/* 배지 — 브랜드만, 기술 용어 제거 */}
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-bg-card px-3 py-1.5 text-xs font-medium text-ink-muted">
              🇰🇷 {t("hero_badge")}
            </span>

            <h1 className="font-serif text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
              {t("hero_headline")}
            </h1>

            <p className="text-lg text-ink-muted leading-relaxed max-w-md">
              {t("hero_subline")}
            </p>

            {/* CTA — Primary 1개 + 텍스트 링크 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("hero_cta_primary")} →
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-ink transition-colors"
              >
                {t("hero_cta_secondary")}
              </Link>
            </div>
          </div>

          {/* 오른쪽: 개선된 MiniTimeline */}
          <div className="flex items-center justify-center md:justify-end">
            <div className="w-full max-w-xs">
              <MiniTimeline />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          2. TRUST STRIP
          ───────────────────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-bg-card">
        <div className="page-container py-8">
          <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-ink-soft mb-5">
            {t("trust_title")}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { stat: "50+",  label: t("trust_guardian_count") },
              { stat: "4.9★", label: t("trust_avg_rating")    },
              { stat: "7",    label: t("trust_language_count") },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1 rounded-[var(--radius-lg)] bg-bg p-4"
              >
                <span className="font-serif text-2xl font-semibold text-ink">{item.stat}</span>
                <span className="text-[10px] text-ink-muted text-center leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          3. PROBLEM → BRIDGE
          신설: Pain-point 3개 → "우리가 해결합니다" 브릿지
          ───────────────────────────────────────────────────────────────────── */}
      <section className="page-container py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl mb-8">
            {t("problem_title")}
          </h2>

          <ul className="space-y-3 mb-8">
            {problemItems.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-line-soft bg-bg-card px-4 py-3.5"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-[11px] font-bold text-destructive">
                  ✕
                </span>
                <p className="text-sm text-ink-muted">{item}</p>
              </li>
            ))}
          </ul>

          {/* 브릿지 */}
          <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-accent-ksm/30 bg-accent-ksm/5 px-5 py-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent-ksm" strokeWidth={2} />
            <p className="text-sm font-semibold text-ink">{t("problem_bridge")}</p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          4. HOW IT WORKS
          아이콘: Lucide로 통일 (이모지 불일치 해소)
          ───────────────────────────────────────────────────────────────────── */}
      <section className="bg-bg-sunken py-16 md:py-20">
        <div className="page-container">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
              {t("how_title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {howSteps.map((step) => (
              <div
                key={step.n}
                className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-line bg-bg-card p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="font-serif text-4xl font-bold text-line">{step.n}</span>
                  <div className="flex size-9 items-center justify-center rounded-full bg-accent-ksm/10 text-accent-ksm">
                    <step.Icon className="size-5" strokeWidth={1.75} />
                  </div>
                </div>
                <h3 className="font-serif text-lg font-semibold text-ink">{step.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{step.desc}</p>
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

      {/* ─────────────────────────────────────────────────────────────────────
          5. GUARDIAN SHOWCASE
          개선: specialty 태그 + 대표 루트 + 여행 스타일 문장
          ───────────────────────────────────────────────────────────────────── */}
      <section className="page-container py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
              {t("guardians_title")}
            </h2>
            <p className="text-sm text-ink-muted">선택 기준: 전문 분야 · 언어 · 대표 루트</p>
          </div>
          <Link
            href="/explore"
            className="hidden text-sm font-semibold text-accent-ksm hover:text-accent-dark sm:block"
          >
            {t("guardians_cta")} →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_GUARDIANS.map((g) => (
            <div
              key={g.id}
              className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-line bg-bg-card p-5 hover:shadow-[var(--shadow-sm)] transition-shadow"
            >
              {/* 아바타 + 기본 정보 */}
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-bg-sunken text-2xl">
                  {g.emoji}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink text-sm leading-tight">{g.name}</p>
                  <p className="text-[11px] text-ink-muted">{g.origin}</p>
                </div>
                {/* 평점 우측 상단 */}
                <div className="ml-auto text-right">
                  <p className="text-sm font-bold text-ink">{g.rating}★</p>
                  <p className="text-[10px] text-ink-soft">{g.reviews} reviews</p>
                </div>
              </div>

              {/* 여행 스타일 */}
              <p className="text-xs text-ink-muted italic leading-relaxed border-l-2 border-accent-ksm/40 pl-2.5">
                {g.style}
              </p>

              {/* 전문 분야 태그 */}
              <div>
                <p className="text-[10px] font-semibold text-ink-soft uppercase tracking-wide mb-1.5">
                  {t("guardian_specialty_label")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {g.specialty.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-bg-sunken px-2.5 py-0.5 text-[10px] font-semibold text-ink-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* 대표 루트 */}
              <div className="flex items-center justify-between border-t border-line-whisper pt-3">
                <div>
                  <p className="text-[10px] font-semibold text-ink-soft uppercase tracking-wide">
                    {t("guardian_route_label")}
                  </p>
                  <p className="text-xs font-semibold text-ink">{g.repRoute}</p>
                </div>
                {/* 언어 뱃지 */}
                <div className="flex gap-1">
                  {g.languages.map((l) => (
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
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link href="/explore" className="text-sm font-semibold text-accent-ksm">
            {t("guardians_cta")} →
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          6. PRICING
          개선: SaaS 구독 틀 → 상품 단위 (루트 단건 / 맞춤 설계 / 프리미엄)
          ───────────────────────────────────────────────────────────────────── */}
      <section className="bg-bg-sunken py-16 md:py-20">
        <div className="page-container">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
              {t("pricing_title")}
            </h2>
            <p className="mt-2 text-sm text-ink-muted">루트 1개부터, 맞춤 의뢰까지</p>
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
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-ksm px-3 py-1 text-[10px] font-semibold text-white whitespace-nowrap">
                    ✦ Most Popular
                  </span>
                )}

                {/* 상품명 */}
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    product.featured ? "text-bg/60" : "text-ink-muted"
                  }`}
                >
                  {t(product.nameKey)}
                </p>

                {/* 가격 */}
                <p
                  className={`font-serif text-3xl font-bold ${
                    product.featured ? "text-bg" : "text-ink"
                  }`}
                >
                  {product.price}
                </p>

                {/* 상품 설명 */}
                <p
                  className={`text-sm leading-relaxed ${
                    product.featured ? "text-bg/70" : "text-ink-muted"
                  }`}
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

      {/* ─────────────────────────────────────────────────────────────────────
          7. FINAL CTA
          ───────────────────────────────────────────────────────────────────── */}
      <section className="bg-bg-dark">
        <div className="page-container py-16 md:py-20 text-center flex flex-col gap-5 items-center">
          <h2 className="font-serif text-3xl font-semibold text-bg sm:text-4xl max-w-lg leading-tight">
            {t("final_cta_traveler")}
          </h2>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-md)] hover:bg-accent-dark transition-colors"
          >
            {t("hero_cta_primary")} →
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
