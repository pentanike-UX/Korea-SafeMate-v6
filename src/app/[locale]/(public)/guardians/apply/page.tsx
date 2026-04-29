import { GuardianApplyForm } from "@/components/guardian/guardian-apply-form";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

export const metadata = {
  title: "하루이로 활동하기 | 하루",
  description: "하루이는 정해진 범위 안에서 여행자의 하루를 돕는 사람입니다. 지원 후 영업일 기준 3–5일 내 안내드립니다.",
};

// ── 하루이 등급 단계 ───────────────────────────────────────────────────────────
const TIERS = [
  {
    label: "지원자",
    desc: "지원서를 제출하고 검토를 기다리는 단계입니다.",
    active: true,
  },
  {
    label: "활동 하루이",
    desc: "승인 후 하루웨이를 만들고 여행자 요청에 응답할 수 있습니다.",
    active: false,
  },
  {
    label: "검증 하루이",
    desc: "운영 기준과 후기, 활동 이력을 바탕으로 별도 검토 후 부여됩니다.",
    active: false,
  },
];

// ── 서비스 포함/제외 ──────────────────────────────────────────────────────────
const INCLUDED = [
  "하루웨이 제작",
  "지역별 로컬 정보 제공",
  "언어와 스타일에 맞는 일정 제안",
  "이동 순서와 소요 시간 안내",
  "여행자 요청에 대한 범위 내 응답",
];

const EXCLUDED = [
  "의료·법률·긴급 구조 대응",
  "24시간 보호자 역할",
  "과장된 홍보성 콘텐츠",
  "확인되지 않은 정보 제공",
];

export default function GuardianApplyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">

      {/* ── Hero ── */}
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--brand-trust-blue)]">
          하루이 지원
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-strong)]">
          하루이로 활동하기
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          내가 잘 아는 서울의 하루를<br />
          누군가의 여행으로 만들어보세요.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">

        {/* ── 좌측: 판단 영역 ── */}
        <div className="flex flex-col gap-8 lg:flex-1">

          {/* ① 서비스 범위 */}
          <section aria-label="서비스 범위와 한계" className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text-strong)]">지원 전에 확인해 주세요</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                하루이는 여행자의 하루를 더 쉽게 만드는 사람입니다.
                지역 정보, 이동 팁, 하루웨이 제작, 일정에 맞는 현실적인 조언을 제공합니다.
                다만 의료·법률·긴급 구조를 대신하지는 않습니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* 포함 */}
              <div className="rounded-[var(--radius-lg)] border border-border/60 bg-card/50 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand-trust-blue)]">
                  포함되는 일
                </p>
                <ul className="flex flex-col gap-2">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-snug text-[var(--text-strong)]">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" strokeWidth={1.75} aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {/* 제외 */}
              <div className="rounded-[var(--radius-lg)] border border-border/60 bg-card/50 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  포함되지 않는 일
                </p>
                <ul className="flex flex-col gap-2">
                  {EXCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-snug text-muted-foreground">
                      <XCircle className="mt-0.5 size-4 shrink-0 text-rose-400/70" strokeWidth={1.75} aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ② 하루이 등급 stepper */}
          <section aria-label="하루이 등급 흐름" className="rounded-[var(--radius-xl)] border border-border/60 bg-card/60 p-5 shadow-[var(--shadow-sm)]">
            <p className="text-sm font-semibold text-[var(--text-strong)]">하루이 등급 흐름</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              지원 승인 후 기여 활동에 따라 단계적으로 인정됩니다.
            </p>
            <div className="mt-5 flex flex-col gap-0">
              {TIERS.map((tier, i) => (
                <div key={tier.label} className="flex gap-4">
                  {/* 스텝 인디케이터 */}
                  <div className="flex flex-col items-center">
                    <div
                      className={[
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        tier.active
                          ? "bg-[var(--brand-trust-blue)] text-white"
                          : "border-2 border-border/60 bg-card text-muted-foreground",
                      ].join(" ")}
                    >
                      {i + 1}
                    </div>
                    {i < TIERS.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-border/40 min-h-6" />
                    )}
                  </div>
                  {/* 내용 */}
                  <div className={`pb-5 ${i === TIERS.length - 1 ? "pb-0" : ""}`}>
                    <p className={`text-sm font-semibold leading-none ${tier.active ? "text-[var(--text-strong)]" : "text-muted-foreground"}`}>
                      {tier.label}
                      {tier.active && (
                        <span className="ml-2 rounded-full bg-[var(--brand-trust-blue-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-trust-blue)]">
                          시작
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tier.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* ── 우측: 지원 폼 (sticky) ── */}
        <div className="w-full lg:w-[420px] lg:shrink-0">
          <div className="lg:sticky lg:top-6">
            <section aria-label="하루이 지원 폼">
              <GuardianApplyForm />
            </section>
          </div>
        </div>

      </div>
    </div>
  );
}
