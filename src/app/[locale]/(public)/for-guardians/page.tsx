/**
 * 하루이 모집 랜딩 — /for-guardians
 */
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/constants";
import { ArrowRight, Calendar, MapPin, TrendingUp } from "lucide-react";

export async function generateMetadata() {
  return {
    title: `초기 하루이 모집 중 | ${BRAND.name}`,
    description: "당신이 아는 서울이 누군가의 하루가 됩니다. 하루이로 활동해보세요.",
  };
}

// ── 예상 수익 시나리오 ──────────────────────────────────────────────────────────
const SCENARIOS = [
  { label: "월 3건", routes: 3 },
  { label: "월 5건", routes: 5 },
  { label: "월 10건", routes: 10 },
] as const;

const ROUTE_PRICE = 59000;
const PAYOUT_RATE = 0.8;

function ForGuardiansContent() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-[var(--text-strong)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 60% at 15% 50%, color-mix(in srgb, var(--brand-trust-blue) 50%, transparent), transparent 55%)",
          }}
        />
        <div className="page-container relative z-10 py-20 md:py-28">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/50">
              초기 하루이 모집 중
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              당신이 아는 서울이<br />
              누군가의 하루가 됩니다.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/68 sm:text-lg">
              내가 잘 아는 동네, 카페, 골목, 이동 팁을<br />
              하루웨이로 만들고 수익으로 연결해보세요.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/guardians/apply"
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-md transition-all hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98]"
              >
                하루이 지원하기
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-white/22 bg-white/8 px-6 py-3 text-sm font-semibold text-white/80 transition-all hover:bg-white/14"
              >
                활동 방식 보기
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/36">
              지원 검토는 보통 영업일 기준 3–5일이 걸립니다.
            </p>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          섹션 1: 왜 하루이인가요?
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="page-container py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--brand-trust-blue)]">
            하루이란
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-strong)] sm:text-3xl md:text-4xl">
            왜 하루이인가요?
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 max-w-3xl mx-auto">
          {[
            {
              icon: Calendar,
              title: "내 시간에 맞춰 활동",
              body: "본업이나 일상과 병행할 수 있습니다.",
            },
            {
              icon: MapPin,
              title: "내가 아는 서울이 상품이 됩니다",
              body: "자주 걷는 동네와 나만의 기준이 하루웨이가 됩니다.",
            },
            {
              icon: TrendingUp,
              title: "판매된 만큼 정산",
              body: "하루웨이 판매와 요청 완료 기준으로 수익을 정산합니다.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border/60 bg-card/50 p-6 shadow-[var(--shadow-sm)]"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[var(--brand-trust-blue-soft)] text-[var(--brand-trust-blue)]">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <h3 className="text-base font-semibold text-[var(--text-strong)]">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          섹션 2: 예상 수익
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="border-y border-border/50 bg-[color-mix(in_srgb,var(--muted)_40%,var(--bg-page))] py-16 md:py-20">
        <div className="page-container">
          <div className="mx-auto max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--brand-trust-blue)]">
              수익 구조
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-strong)] sm:text-3xl md:text-4xl">
              예상 수익
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              판매된 하루웨이 수와 정산 기준에 따라 수익이 달라집니다.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {SCENARIOS.map(({ label, routes }) => {
                const gross = ROUTE_PRICE * routes;
                const net = Math.round(gross * PAYOUT_RATE);
                return (
                  <div
                    key={label}
                    className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border/60 bg-card p-5 shadow-[var(--shadow-sm)]"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {label}
                    </p>
                    <p className="text-3xl font-bold tabular-nums text-[var(--text-strong)]">
                      ₩{net.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80">
                      {routes} × ₩{ROUTE_PRICE.toLocaleString()} × 80%
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/70">
              세전 금액이며, 실제 정산 금액은 정책과 세금에 따라 달라질 수 있습니다.
              초기 하루이에게는 수수료 우대 정책이 적용될 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          섹션 3: 초기 하루이 혜택
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="page-container py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--brand-trust-blue)]">
            초기 혜택
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-strong)] sm:text-3xl md:text-4xl">
            초기 하루이 혜택
          </h2>
          <ul className="mt-8 flex flex-col gap-3">
            {[
              "첫 3개월 수수료 우대",
              "첫 5개 하루웨이 운영팀 리뷰 지원",
              "초기 하루이 배지 제공",
              "활동 가이드와 샘플 템플릿 제공",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border/60 bg-card/50 px-4 py-3.5"
              >
                <span className="text-emerald-500 text-base leading-none shrink-0">✓</span>
                <span className="text-sm text-[var(--text-strong)] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-[var(--radius-xl)] border border-[var(--brand-trust-blue)]/25 bg-[var(--brand-trust-blue-soft)]/60 px-6 py-6 text-center">
            <p className="text-sm font-semibold text-[var(--text-strong)]">
              서울의 하루를 열어볼까요?
            </p>
            <Link
              href="/guardians/apply"
              className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-trust-blue)] px-7 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            >
              하루이 지원하기
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              지원 검토는 보통 영업일 기준 3–5일이 걸립니다.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

export default function ForGuardiansPage() {
  return <ForGuardiansContent />;
}
