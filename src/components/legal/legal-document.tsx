import { AlertTriangle } from "lucide-react";

export interface LegalSection {
  heading: string;
  /** 단락 배열 — 각 항목은 한 문단. */
  paragraphs: string[];
}

/**
 * 약관·개인정보처리방침 공용 렌더러.
 * 법적 구속력 있는 본문은 법무 검토 후 확정 — 현재는 구조화된 초안.
 */
export function LegalDocument({
  title,
  lastUpdated,
  intro,
  sections,
  isKo,
}: {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  isKo: boolean;
}) {
  return (
    <div className="min-h-[100dvh] bg-bg">
      <section className="border-b border-line bg-bg-card">
        <div className="page-container py-12 md:py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft">
            {isKo ? "법적 고지" : "Legal"}
          </p>
          <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-ink-soft">
            {isKo ? "최종 업데이트" : "Last updated"}: {lastUpdated}
          </p>
        </div>
      </section>

      <section className="page-container py-10 md:py-14">
        <div className="max-w-2xl">
          {/* 초안 배너 — 법무 확정 전 명시 */}
          <div className="mb-8 flex items-start gap-2.5 rounded-[var(--radius-lg)] border border-amber-300/50 bg-amber-50/70 px-4 py-3 dark:bg-amber-950/20">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            <p className="text-[13px] leading-relaxed text-amber-800 dark:text-amber-200">
              {isKo
                ? "본 문서는 법무 검토 전 초안입니다. 정식 출시 전 최종본으로 대체됩니다."
                : "This document is a pre-review draft and will be replaced with the finalized version before launch."}
            </p>
          </div>

          <p className="mb-8 text-sm leading-relaxed text-ink-muted">{intro}</p>

          <div className="flex flex-col gap-8">
            {sections.map((s, i) => (
              <div key={s.heading}>
                <h2 className="mb-2 font-serif text-lg font-semibold text-ink">
                  {i + 1}. {s.heading}
                </h2>
                <div className="flex flex-col gap-2">
                  {s.paragraphs.map((p, j) => (
                    <p key={j} className="text-sm leading-relaxed text-ink-muted">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
