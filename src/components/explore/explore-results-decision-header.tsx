"use client";

import { useTranslations } from "next-intl";

/**
 * 추천 결과(step 4) 상단 — 고정 헤드라인·서브(결정 화면 톤).
 */
export function ExploreResultsDecisionHeader() {
  const t = useTranslations("ExploreJourney");

  return (
    <header className="text-center sm:text-left">
      <p className="text-primary inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase sm:justify-start">
        {t("resultsEyebrow")}
      </p>
      <h1 className="text-text-strong mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("resultsHeadline")}</h1>
      <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:mx-0">{t("resultsSubLead")}</p>
    </header>
  );
}
