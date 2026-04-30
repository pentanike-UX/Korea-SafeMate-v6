/**
 * M05 — Pricing
 * IA §4.3 M05 · 릴리즈 [M]
 * SCREEN_SPECS_3A §M05
 * Updated: cashflow 구조 반영 (탐색 무료 / 실행 유료)
 */
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Check } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  return {
    title: `요금 — ${BRAND.name}`,
    description: "하루웨이는 먼저 둘러보고, 실행과 맞춤 요청이 필요할 때 결제합니다.",
  };
}

const TIERS = [
  {
    key: "basic",
    tag: "하루 바로 시작",
    price: "₩29,000",
    role: "완성된 하루웨이를 그대로 따라갑니다.",
    usage: "하루웨이 상세에서 전체 가이드를 열 때",
    cta: "하루웨이 보기",
    ctaHref: "/posts",
    featured: false,
    includes: [
      "전체 스팟별 실행 가이드",
      "사진 포인트",
      "주의사항",
      "다음 스팟 이동 정보",
      "저장 및 오프라인 보기",
      "지도앱 열기 링크",
    ],
    excludes: [
      "하루이 개인 상담",
      "맞춤 루트 수정",
    ],
  },
  {
    key: "standard",
    tag: "하루 맡기기",
    price: "₩59,000",
    role: "내 날짜·취향에 맞게 하루이가 루트를 조정합니다.",
    usage: "내 일정에 맞게 하루이에게 조정 요청할 때",
    cta: "내 일정에 맞게 요청",
    ctaHref: "/posts",
    featured: true,
    includes: [
      "여행 날짜·시작/종료 위치 반영",
      "관심사·피하고 싶은 것 반영",
      "동행 인원·이동 선호 반영",
      "하루이의 1회 답변 또는 1회 수정",
      "요청 상태 추적",
    ],
    excludes: [
      "실시간 채팅",
      "무제한 상담",
    ],
  },
  {
    key: "premium",
    tag: "하루 풀서비스",
    price: "₩119,000",
    role: "하루이와 상담하며 하루를 세밀하게 조율합니다.",
    usage: "하루이 상담과 맞춤 설계가 필요할 때",
    cta: "하루이와 조율하기",
    ctaHref: "/guardians",
    featured: false,
    includes: [
      "하루이 상담 · 24시간 내 답변",
      "맞춤 하루 설계",
      "복수 후보 루트 제안",
      "여행 전 최종 확인",
      "일정 중간 조정 요청",
    ],
    excludes: [
      "긴급 상황 대응",
      "의료·법률·통역 서비스",
      "24시간 실시간 보호",
    ],
  },
] as const;

const FAQS = [
  {
    q: "하루웨이를 먼저 둘러볼 수 있나요?",
    a: "네. 하루웨이 목록, 하루 흐름, 한눈에 보는 하루 요약, 스팟 순서, 하루이 프로필은 무료로 확인할 수 있습니다. 스팟별 상세 실행 가이드와 개인화 요청에서 결제가 시작됩니다.",
  },
  {
    q: "하루 바로 시작과 하루 맡기기의 차이는 무엇인가요?",
    a: "하루 바로 시작은 완성된 하루웨이를 그대로 열어보는 상품입니다. 하루 맡기기는 여행 날짜·관심사 등 내 조건을 하루이에게 전달하고, 하루이가 루트를 맞춤 조정해 드리는 상품입니다.",
  },
  {
    q: "하루 풀서비스는 실시간 채팅인가요?",
    a: "아닙니다. 하루이 상담은 요청 기반으로 진행되며 24시간 내 답변을 원칙으로 합니다. 실시간 무제한 채팅과는 다릅니다. 긴급 상황 대응, 의료·법률·통역 서비스를 대체하지 않습니다.",
  },
  {
    q: "하루이에게 환불을 요청할 수 있나요?",
    a: "하루웨이 미제공 시 전액 환불 기준을 적용합니다. 상세 환불 기준은 별도 정책으로 공지 예정입니다.",
  },
];

export default async function PricingPage() {
  await getTranslations("Pricing"); // keep translation namespace alive

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">

      {/* ── 헤더 ── */}
      <section className="border-b border-border/50 bg-[var(--text-strong)]">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/50">요금</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            탐색은 무료<br />
            실행은 유료
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/68">
            하루웨이는 먼저 둘러보고,<br />
            실행과 맞춤 요청이 필요할 때 결제합니다.
          </p>
        </div>
      </section>

      {/* ── 무료/유료 범위 ── */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-[var(--shadow-sm)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">무료</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-strong)]">먼저 둘러보는 것은 무료입니다</p>
            <ul className="mt-3 space-y-1.5">
              {[
                "하루웨이 목록 탐색",
                "하루 흐름 카드",
                "한눈에 보는 하루 요약",
                "스팟명 및 이동 순서 확인",
                "하루이 프로필 보기",
                "비슷한 하루웨이 보기",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground/75">
                  <Check className="size-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-[var(--brand-primary-soft)]/40 p-5 shadow-[var(--shadow-sm)]">
            <p className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">유료 전환 지점</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-strong)]">실행과 개인화에서 결제가 시작됩니다</p>
            <ul className="mt-3 space-y-1.5">
              {[
                "스팟별 상세 실행 가이드",
                "사진 포인트 · 주의사항",
                "다음 스팟 이동 세부 정보",
                "저장 · 오프라인 보기",
                "내 일정에 맞게 요청",
                "하루이 상담",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground/75">
                  <ArrowRight className="size-3.5 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 요금제 카드 ── */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:pb-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TIERS.map(({ key, tag, price, role, usage, cta, ctaHref, featured, includes, excludes }) => (
            <div
              key={key}
              className={cn(
                "relative flex flex-col gap-5 rounded-2xl border p-6",
                featured
                  ? "border-[var(--brand-trust-blue)]/40 bg-[var(--brand-trust-blue-soft)] shadow-[var(--shadow-lg)] sm:scale-[1.02]"
                  : "border-border/60 bg-card/60 shadow-[var(--shadow-sm)]",
              )}
            >
              {featured && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--brand-trust-blue)] px-4 py-0.5 text-[10px] font-bold text-white tracking-wide">
                  ✦ 가장 인기
                </span>
              )}

              <div>
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em]",
                  featured ? "text-[var(--brand-trust-blue)]" : "text-muted-foreground",
                )}>
                  {tag}
                </p>
                <p className={cn(
                  "mt-2 text-3xl font-bold",
                  featured ? "text-[var(--text-strong)]" : "text-[var(--text-strong)]",
                )}>
                  {price}
                </p>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">{role}</p>

              <div className="flex-1 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">포함</p>
                <ul className="space-y-1.5">
                  {includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-foreground/80">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                {excludes.length > 0 && (
                  <>
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/60">제외</p>
                    <ul className="space-y-1">
                      {excludes.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-[12px] text-muted-foreground/60">
                          <span className="mt-0.5 shrink-0">–</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="space-y-2 border-t border-border/40 pt-4">
                <p className="text-[11px] text-muted-foreground">사용 지점: {usage}</p>
                <Link
                  href={ctaHref}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.01]",
                    featured
                      ? "bg-[var(--brand-trust-blue)] text-white hover:opacity-90"
                      : "border border-border/70 bg-background text-[var(--text-strong)] hover:bg-muted",
                  )}
                >
                  {cta}
                  <ArrowRight className="size-3.5 opacity-60" aria-hidden />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          하루 풀서비스는 긴급 대응, 의료·법률·통역 서비스를 대체하지 않습니다.
          하루이 상담은 요청 기반이며 24시간 내 답변을 원칙으로 합니다.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[color-mix(in_srgb,var(--muted)_50%,var(--bg-page))] py-14 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold text-[var(--text-strong)] sm:text-3xl">자주 묻는 질문</h2>
          <div className="mt-8 flex flex-col gap-4">
            {FAQS.map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-border/60 bg-card/70 open:border-primary/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-[var(--text-strong)]">
                  {faq.q}
                  <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden>↓</span>
                </summary>
                <div className="border-t border-border/50 px-5 py-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6">
        <p className="text-base text-muted-foreground">
          먼저 하루웨이를 둘러보세요. 결제는 필요할 때만 합니다.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-brand)] transition-all hover:opacity-90 hover:scale-[1.02]"
          >
            하루웨이 보기
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/guardians"
            className="inline-flex items-center gap-2 rounded-xl border border-border/70 px-8 py-3 text-sm font-semibold text-[var(--text-strong)] transition-all hover:bg-muted hover:scale-[1.02]"
          >
            하루이 보기
          </Link>
        </div>
      </section>

    </div>
  );
}
