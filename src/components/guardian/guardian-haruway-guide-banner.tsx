"use client";

import { Info } from "lucide-react";

/**
 * 하루웨이 본문 작성 가이드 배너 — 에디터 상단에 항상 노출.
 * AI_CONTENT_HARUWAY_RULES.md 의 핵심 5개 금지 항목을 짧게 환기.
 */
export function GuardianHaruwayGuideBanner() {
  return (
    <aside
      role="note"
      className="rounded-2xl border border-emerald-300/40 bg-emerald-50/60 p-4 dark:border-emerald-700/40 dark:bg-emerald-950/20"
    >
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
        <Info className="size-3.5" aria-hidden />
        하루웨이 본문 작성 가이드
      </p>
      <p className="text-[13px] leading-relaxed text-foreground/85">
        하루웨이 포스트는 무료 콘텐츠입니다.{" "}
        <strong className="text-foreground">정확한 장소명, 이동 순서, 지도, 사진 포인트, 결제 가능 스팟 정보는 하루루트에서 공개됩니다.</strong>
        {" "}본문에서는 테마의 매력·분위기, 아티스트/작품 맥락만 소개하세요.
      </p>
      <ul className="mt-2 space-y-1 text-[11.5px] text-muted-foreground">
        <li>· 차분하고 세련된 여행 매거진 톤 (감성적이되 과장 없음)</li>
        <li>· 광역 지역명·아티스트·작품명·분위기 OK / 정확한 스팟명·동선·거리·시간 NG</li>
        <li>· 마지막 단락은 하루루트로 자연스럽게 이어주는 한 줄</li>
      </ul>
    </aside>
  );
}
