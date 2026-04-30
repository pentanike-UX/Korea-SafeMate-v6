"use client";

import { Link } from "@/i18n/navigation";
import { ArrowRight, CheckCircle2, Clock, Compass, MapPin, RotateCcw, Shield, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// ── 섹션 래퍼 ──────────────────────────────────────────────────────────────────
function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20", className)}>
      {children}
    </section>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--brand-trust-blue)]">
      {children}
    </p>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function AboutLanding() {
  return (
    <div className="bg-[var(--bg-page)] text-[var(--text-primary)]">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. HERO — 하루란?
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="bg-[var(--text-strong)]">
        <div className="page-container max-w-5xl px-4 py-20 sm:px-6 sm:py-24 md:py-28">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/52">서울 로컬 루트 서비스</p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.05]">
            하루란?
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/78">
            좋은 하루 하나를 고르고,<br />
            그대로 따라가는 서비스입니다.
          </p>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-white/58">
            현지인이 만든 루트로<br />
            서울을 더 쉽게 움직이세요.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/explore/routes"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-md transition-all hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Compass className="size-4" strokeWidth={1.75} aria-hidden />
              하루웨이 보기
              <ArrowRight className="size-3.5 opacity-70" aria-hidden />
            </Link>
            <Link
              href="/guardians"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/28 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/16 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Users className="size-4" strokeWidth={1.75} aria-hidden />
              하루이 보기
            </Link>
          </div>
        </div>
      </Section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. 왜 하루인가
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <Kicker>왜 하루인가</Kicker>
        <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          서울에서 뭐 할지 찾느라<br />
          하루를 쓰고 싶지 않으니까요.
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">
          하루는 검색 시간을 줄이고, 현지인이 만든 루트로 바로 움직일 수 있게 돕습니다.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: Star,
              title: "검색보다 빠르게",
              body: "좋은 하루 하나만 고르면 됩니다.",
            },
            {
              icon: MapPin,
              title: "현지인처럼 자연스럽게",
              body: "하루이가 만든 동선을 따라 움직입니다.",
            },
            {
              icon: Compass,
              title: "낯선 서울도 쉽게",
              body: "어디를 갈지, 어떤 순서로 움직일지 한 번에 확인합니다.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="border-border/70 bg-card/50 flex flex-col gap-3 rounded-[var(--radius-lg)] border p-6 shadow-[var(--shadow-sm)]"
            >
              <span className="bg-primary/10 text-primary inline-flex size-11 items-center justify-center rounded-xl">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <h3 className="text-text-strong text-base font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. 하루웨이란?
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="border-border/50 border-y bg-[color-mix(in_srgb,var(--muted)_40%,var(--bg-page))]">
        <div className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <Kicker>하루웨이란?</Kicker>
              <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                하루이가 만든 하루 단위 루트
              </h2>
              <p className="text-muted-foreground mt-4 text-base leading-relaxed">
                하루웨이는 단순한 장소 목록이 아닙니다.<br />
                스팟, 이동 순서, 소요 시간, 추천 이유를 담은<br />
                하루 단위 루트입니다.
              </p>
              <Link
                href="/explore/routes"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-trust-blue)] transition-colors hover:opacity-80"
              >
                하루웨이 보기
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <ul className="flex flex-col gap-4">
              {[
                { icon: MapPin, label: "스팟", desc: "가볼 만한 장소를 직접 고릅니다." },
                { icon: ArrowRight, label: "이동 순서", desc: "동선이 자연스럽게 이어집니다." },
                { icon: Clock, label: "예상 소요 시간", desc: "하루 전체 시간을 미리 파악합니다." },
                { icon: Star, label: "추천 이유", desc: "왜 이 스팟인지 설명이 있습니다." },
                { icon: RotateCcw, label: "대체 옵션", desc: "일부 스팟은 대안을 제시합니다." },
              ].map(({ icon: Icon, label, desc }) => (
                <li key={label} className="flex items-start gap-4">
                  <span className="bg-primary/8 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div>
                    <p className="text-text-strong text-sm font-semibold">{label}</p>
                    <p className="text-muted-foreground mt-0.5 text-[13px] leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. 하루이란?
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <Kicker>하루이란?</Kicker>
        <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          하루를 여는 이들
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">
          하루이는 서울의 하루를 직접 만들고 제안하는 사람들입니다.
          자신이 잘 아는 동네와 취향을 바탕으로
          여행자가 따라갈 수 있는 하루를 만듭니다.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/guardians"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-[var(--text-on-brand)] shadow-sm transition-all hover:opacity-90 hover:scale-[1.02]"
          >
            <Users className="size-4" strokeWidth={1.75} aria-hidden />
            하루이 보기
          </Link>
          <Link
            href="/guardians/apply"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text-strong)] transition-all hover:bg-muted hover:scale-[1.02]"
          >
            하루이 지원하기
            <ArrowRight className="size-3.5 opacity-60" aria-hidden />
          </Link>
        </div>
      </Section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. 하루 시작 방법
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="border-border/50 border-t bg-[color-mix(in_srgb,var(--muted)_40%,var(--bg-page))]">
        <div className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <Kicker>하루 시작 방법</Kicker>
          <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            세 단계면 충분합니다
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
            {[
              {
                n: "01",
                title: "하루웨이 고르기",
                body: "가고 싶은 분위기의 하루를 선택합니다.",
              },
              {
                n: "02",
                title: "하루이 확인하기",
                body: "누가 만든 루트인지 먼저 볼 수 있습니다.",
              },
              {
                n: "03",
                title: "그대로 따라가기",
                body: "동선대로 움직이면 됩니다.",
              },
            ].map(({ n, title, body }) => (
              <li key={n} className="relative flex gap-4 md:flex-col md:gap-5">
                <span className="text-primary/22 font-mono text-5xl font-bold tabular-nums leading-none md:text-6xl">
                  {n}
                </span>
                <div>
                  <h3 className="text-text-strong text-lg font-semibold">{title}</h3>
                  <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. 요금
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section id="pricing" className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <Kicker>요금</Kicker>
        <h2 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          탐색은 무료, 실행은 유료
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">
          하루웨이는 먼저 둘러볼 수 있습니다.<br />
          스팟별 상세 가이드를 열거나, 내 일정에 맞게 하루이에게 요청할 때 결제가 진행됩니다.
        </p>

        {/* 무료/유료 범위 한눈에 */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="border-border/60 rounded-[var(--radius-xl)] border bg-card/50 p-5 shadow-[var(--shadow-sm)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">무료</p>
            <ul className="mt-3 space-y-1.5">
              {["하루웨이 목록 탐색", "하루 흐름 보기", "한눈에 보는 하루 요약", "스팟명 및 순서 확인", "하루이 프로필 보기", "비슷한 하루웨이 보기"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                  <span className="text-[var(--brand-trust-blue)] text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-primary/20 rounded-[var(--radius-xl)] border bg-[var(--brand-primary-soft)]/30 p-5 shadow-[var(--shadow-sm)]">
            <p className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">유료 전환</p>
            <ul className="mt-3 space-y-1.5">
              {["스팟별 상세 실행 가이드", "사진 포인트 · 주의사항", "다음 스팟 이동 세부 정보", "저장 · 오프라인 보기", "내 일정에 맞게 요청", "하루이 상담"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                  <span className="text-primary text-xs font-bold">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 요금제 카드 */}
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            {
              tag: "하루 바로 시작",
              price: "₩29,000",
              role: "완성된 하루웨이를 그대로 따라갑니다.",
              usage: "하루웨이 상세에서 전체 가이드를 열 때",
              items: ["전체 스팟별 실행 가이드", "사진 팁 · 주의사항", "이동 정보 · 저장 · 오프라인"],
              cta: "하루 바로 시작",
              href: "/posts",
              featured: false,
            },
            {
              tag: "하루 맡기기",
              price: "₩59,000",
              role: "날짜·취향에 맞게 하루이가 루트를 조정합니다.",
              usage: "내 일정에 맞게 하루이에게 조정 요청할 때",
              items: ["여행 날짜 · 시작/종료 위치 반영", "관심사 · 이동 선호 반영", "1회 답변 또는 1회 수정 포함"],
              cta: "내 일정에 맞게 요청",
              href: "/posts",
              featured: true,
            },
            {
              tag: "하루 풀서비스",
              price: "₩119,000",
              role: "하루이와 상담하며 하루를 세밀하게 조율합니다.",
              usage: "하루이 상담과 맞춤 설계가 필요할 때",
              items: ["하루이 상담 · 24시간 내 답변", "맞춤 하루 설계 · 복수 후보 제안", "여행 전 최종 확인 포함"],
              cta: "하루이와 조율하기",
              href: "/guardians",
              featured: false,
            },
          ].map(({ tag, price, role, usage, items, cta, href, featured }) => (
            <div
              key={tag}
              className={cn(
                "relative flex flex-col gap-4 rounded-[var(--radius-xl)] border p-6",
                featured
                  ? "border-[var(--brand-trust-blue)]/40 bg-[var(--brand-trust-blue-soft)] shadow-[var(--shadow-md)] sm:scale-[1.02]"
                  : "border-border/70 bg-card/50 shadow-[var(--shadow-sm)]",
              )}
            >
              {featured && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--brand-trust-blue)] px-4 py-0.5 text-[10px] font-bold text-white tracking-wide">
                  ✦ 가장 인기
                </span>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{tag}</p>
                <p className="text-text-strong mt-2 text-3xl font-bold">{price}</p>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{role}</p>
              <ul className="flex-1 space-y-1.5 border-t border-border/50 pt-3">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] text-foreground/75">
                    <span className="mt-0.5 shrink-0 text-[var(--brand-trust-blue)] text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-[11px]">사용 지점: {usage}</p>
              <Link
                href={href}
                className={cn(
                  "mt-auto inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]",
                  featured
                    ? "bg-[var(--brand-trust-blue)] text-white hover:opacity-90"
                    : "border border-border/80 bg-background text-text-strong hover:bg-muted",
                )}
              >
                {cta}
                <ArrowRight className="size-3.5 opacity-60" aria-hidden />
              </Link>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          하루 풀서비스는 긴급 대응, 의료·법률·통역 서비스를 대체하지 않습니다.
        </p>
      </Section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          7. 신뢰와 기준
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="border-border/50 border-t bg-[color-mix(in_srgb,var(--muted)_40%,var(--bg-page))]">
        <div className="page-container max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <div className="border-border/70 bg-card/60 rounded-[var(--radius-xl)] border px-6 py-10 sm:px-10 sm:py-12">
            <Kicker>신뢰와 기준</Kicker>
            <h2 className="text-text-strong mt-3 text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
              하루는 과한 약속보다<br />
              확인할 수 있는 정보를 먼저 보여줍니다.
            </h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Shield, title: "하루이 프로필", body: "언어·스타일·후기를 연결 전에 확인합니다." },
                { icon: CheckCircle2, title: "사용 언어", body: "대화 가능한 언어를 명시합니다." },
                { icon: Star, title: "후기", body: "실제 여행자 피드백이 쌓입니다." },
                { icon: MapPin, title: "제공 범위", body: "현장 동행·정보 지원이며 의료·법률·긴급 구조는 범위 밖입니다." },
                { icon: RotateCcw, title: "환불 기준", body: "하루웨이 미제공 시 전액 환불합니다." },
                { icon: Users, title: "검증 기준", body: "운영 기준을 통과한 하루이만 매칭 후보에 올라옵니다." },
              ].map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex flex-col gap-2">
                  <Icon className="text-[var(--brand-trust-blue)] size-5" strokeWidth={1.75} aria-hidden />
                  <p className="text-text-strong text-sm font-semibold">{title}</p>
                  <p className="text-muted-foreground text-[13px] leading-relaxed">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          8. Final CTA
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="bg-[var(--text-strong)]">
        <div className="page-container max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 md:py-24">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
            오늘 하루, 바로 시작해보세요
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/68">
            하루웨이를 고르거나, 먼저 하루이를 살펴보세요.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
            <Link
              href="/explore/routes"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-white px-8 py-3 text-sm font-semibold text-zinc-900 shadow-md transition-all hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Compass className="size-4" strokeWidth={1.75} aria-hidden />
              하루웨이 보기
            </Link>
            <Link
              href="/guardians"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/28 bg-white/10 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-white/16 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Users className="size-4" strokeWidth={1.75} aria-hidden />
              하루이 보기
            </Link>
            <Link
              href="/guardians/apply"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/18 bg-white/6 px-8 py-3 text-sm font-semibold text-white/80 transition-all hover:bg-white/12 hover:scale-[1.02] active:scale-[0.98]"
            >
              하루이 지원하기
              <ArrowRight className="size-3.5 opacity-70" aria-hidden />
            </Link>
          </div>
        </div>
      </Section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          법적 고지 (terms · privacy 앵커 유지)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="page-container max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="text-center text-sm text-muted-foreground">
          하루는 현장 동행·실용 정보 서비스입니다. 의료·법률·긴급 구조를 대체하지 않으며 24시간 보호를 보장하지 않습니다.
        </p>
        <div className="mt-8 space-y-3">
          <div id="terms" className="scroll-mt-24 rounded-[var(--radius-md)] border border-border/70 bg-card/40">
            <div className="flex items-center justify-between gap-2 px-4 py-3.5 text-sm font-semibold text-muted-foreground">
              <span className="opacity-75">이용약관</span>
              <span aria-hidden className="text-xs">🔒</span>
            </div>
            <div className="border-t border-border/60 px-4 py-4 text-[15px] leading-relaxed text-muted-foreground">
              정식 오픈 전 공개 예정입니다.
            </div>
          </div>
          <div id="privacy" className="scroll-mt-24 rounded-[var(--radius-md)] border border-border/70 bg-card/40">
            <div className="flex items-center justify-between gap-2 px-4 py-3.5 text-sm font-semibold text-muted-foreground">
              <span className="opacity-75">개인정보처리방침</span>
              <span aria-hidden className="text-xs">🔒</span>
            </div>
            <div className="border-t border-border/60 px-4 py-4 text-[15px] leading-relaxed text-muted-foreground">
              정식 오픈 전 공개 예정입니다.
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
