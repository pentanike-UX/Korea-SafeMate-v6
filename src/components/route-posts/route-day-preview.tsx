"use client";

import { useTranslations } from "next-intl";
import type { ContentPost } from "@/types/domain";
import type { RouteArticleParsed } from "@/lib/post-detail-structured-parse";
import { splitPostBodyParagraphs } from "@/lib/post-detail-body-split";
import { routeCardAreaLabel, routeCardSpotPreviewLine } from "@/lib/route-post-card-meta";
import { cn } from "@/lib/utils";

function normCompact(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function textsOverlap(a: string, b: string): boolean {
  const na = normCompact(a);
  const nb = normCompact(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length > nb.length ? na : nb;
  if (shorter.length < 20) return na === nb;
  return longer.includes(shorter);
}

function firstSentence(text: string, maxLen: number): string {
  const t = text.trim();
  if (!t) return "";
  const cut = t.split(/(?<=[.!?。])\s+/)[0] ?? t;
  const one = cut.split(/\n/)[0]?.trim() ?? cut;
  if (one.length <= maxLen) return one;
  return `${one.slice(0, maxLen - 1).trim()}…`;
}

function clampMemoBody(text: string, maxLen: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1).trim()}…`;
}

/** 제거·숨김: 샘플·루트 메타, 반복 안내, 운영 디스클레이머 성 문장 */
const MEMO_NOISE_PATTERNS: RegExp[] = [
  /아래 카드\s*\d*곳/i,
  /^sample$/i,
  /\bRoute\b/i,
  /루트\s*포함|포함\s*$/i,
  /^(하이브리드\s*)?루트$/i,
  /강남역권\s*[·•,]\s*사진 맞춰/i,
  /날씨\s*[·•]\s*줄\s*변수/i,
  /당일\s*통제|매표\s*줄|휴무는\s*현장/i,
  /스팟별로\s*준비/i,
  /흐름표에서\s*거리/i,
  /^전체$/i,
];

function isMemoNoiseLine(raw: string | null | undefined): boolean {
  const s = raw?.trim();
  if (!s || s.length < 6) return true;
  return MEMO_NOISE_PATTERNS.some((re) => re.test(s));
}

function sanitizeMemoBody(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  if (isMemoNoiseLine(raw)) return null;
  return clampMemoBody(raw, 200);
}

function dedupeLines(lines: Array<string | null | undefined>, reference: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const t = line?.trim();
    if (!t || t.length < 8) continue;
    if (isMemoNoiseLine(t)) continue;
    if (reference.some((ref) => ref && textsOverlap(t, ref))) continue;
    if (out.some((o) => textsOverlap(t, o))) continue;
    out.push(t);
  }
  return out;
}

function firstCompactLine(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  const paras = splitPostBodyParagraphs(text);
  const line = paras[0]?.trim();
  if (!line) return null;
  return line.slice(0, 200);
}

function extractJudgementQuote(texts: Array<string | null | undefined>): string | null {
  const lines = texts
    .flatMap((t) => splitPostBodyParagraphs(t ?? ""))
    .map((x) => x.trim())
    .filter((x) => x.length >= 12 && !isMemoNoiseLine(x));
  // 우선 1: 장소 고유 사실·경험 (가장 짧고 기억하기 쉬운 한 줄)
  const priority = lines.find((x) => /궁궐 내|화장실이 없|화장실 없/.test(x));
  if (priority && !isMemoNoiseLine(priority)) return priority;
  // 우선 2: 운영 주의
  const strong = lines.find((x) => /궁 안|다시 나오기|길 수|대기 줄|변수/.test(x));
  if (strong && !isMemoNoiseLine(strong)) return strong;
  return lines[0] ?? null;
}

function cultureMemoVariantKey(blob: string): "palace" | "gangnam" | "default" {
  if (/광화문|경복궁|도심|종로/.test(blob)) return "palace";
  if (/강남|테헤란|역삼|선릉/.test(blob)) return "gangnam";
  return "default";
}

function quoteFallbackVariantKey(blob: string): "palace" | "gangnam" | "default" {
  if (/광화문|경복궁|궁/.test(blob)) return "palace";
  if (/강남|테헤란|역삼/.test(blob)) return "gangnam";
  return "default";
}

/** 상단 — 하나의 현장 메모 카드 */
export function RouteDayPreview({
  post,
  className,
  introLead,
  topHighlights,
  venueSafe = false,
  articleParsed,
}: {
  post: ContentPost;
  className?: string;
  introLead?: string | null;
  topHighlights?: string[];
  venueSafe?: boolean;
  articleParsed?: RouteArticleParsed | null;
}) {
  const t = useTranslations("RoutePosts");
  const journey = post.route_journey;
  if (!journey) return null;

  const meta = journey.metadata;
  const exposure = journey.structured_exposure_meta;

  const timeKey = `fieldMemoTimeChip.${meta.recommended_time_of_day}` as
    | "fieldMemoTimeChip.morning"
    | "fieldMemoTimeChip.afternoon"
    | "fieldMemoTimeChip.evening"
    | "fieldMemoTimeChip.night"
    | "fieldMemoTimeChip.flexible";

  const paceKey = `fieldMemoPace.${meta.difficulty}` as "fieldMemoPace.easy" | "fieldMemoPace.moderate" | "fieldMemoPace.active";

  const areaLabel = routeCardAreaLabel(post);
  const spotPreviewLine = routeCardSpotPreviewLine(post, 2, { venueSafe });
  const localeBlob = `${areaLabel} ${spotPreviewLine ?? ""} ${post.title}`;

  const moodCore =
    exposure?.summary_card?.trim() ||
    post.summary
      .trim()
      .split(/\n+/)[0]
      ?.trim()
      .slice(0, 280) ||
    "";

  const routeSummary = articleParsed?.routeSummary?.trim();
  const beforeYouGoRaw = articleParsed?.beforeYouGo?.trim();
  const routeClosingRaw = articleParsed?.routeClosing?.trim();

  const summaryPrimary =
    routeSummary || moodCore || introLead?.trim() || post.summary.trim().split(/\n+/)[0]?.trim() || "";

  const subtitleText =
    summaryPrimary.length > 0
      ? firstSentence(summaryPrimary, 220)
      : firstSentence(t("introFallbackMinimal"), 220);

  const routeSummaryParas = routeSummary ? splitPostBodyParagraphs(routeSummary) : [];
  const beforeParas = beforeYouGoRaw ? splitPostBodyParagraphs(beforeYouGoRaw) : [];
  const closingParas = routeClosingRaw ? splitPostBodyParagraphs(routeClosingRaw) : [];

  const referenceForDedupe = [subtitleText, introLead?.trim() ?? ""].filter(Boolean);

  const highlightLines = dedupeLines(topHighlights ?? [], referenceForDedupe);

  const movementSeed = spotPreviewLine?.trim() || null;

  const orientationFromSecondPara =
    routeSummaryParas.length > 1 ? sanitizeMemoBody(firstCompactLine(routeSummaryParas[1])) : null;

  const orientationFromFirstPara =
    routeSummaryParas.length > 0
      ? sanitizeMemoBody(firstCompactLine(routeSummaryParas[0]))
      : null;

  const orientationBody =
    orientationFromSecondPara ||
    (orientationFromFirstPara && !textsOverlap(orientationFromFirstPara, subtitleText)
      ? orientationFromFirstPara
      : null) ||
    sanitizeMemoBody(movementSeed) ||
    t("fieldMemoFallbackOrientation");

  const prepBody =
    sanitizeMemoBody(firstCompactLine(beforeParas.join("\n"))) ||
    sanitizeMemoBody(highlightLines.find((h) => !textsOverlap(h, orientationBody ?? ""))) ||
    t("fieldMemoFallbackPrep");

  const crowdCandidates = highlightLines.filter(
    (h) =>
      !textsOverlap(h, orientationBody ?? "") &&
      !textsOverlap(h, prepBody ?? "") &&
      !isMemoNoiseLine(h),
  );
  const crowdBody =
    sanitizeMemoBody(crowdCandidates[0]) ||
    sanitizeMemoBody(
      closingParas.length > 1 ? firstCompactLine(closingParas.slice(1).join("\n")) : null,
    ) ||
    t("fieldMemoFallbackCrowd");

  const cultureVariant = cultureMemoVariantKey(localeBlob);
  const vibeBody =
    sanitizeMemoBody(firstCompactLine(routeClosingRaw)) ||
    sanitizeMemoBody(t(`fieldMemoCulture.${cultureVariant}`)) ||
    t("fieldMemoFallbackVibe");

  const judgementQuote = extractJudgementQuote([beforeYouGoRaw, routeClosingRaw, ...highlightLines]);
  const quoteVariant = quoteFallbackVariantKey(localeBlob);
  const fieldQuote =
    sanitizeMemoBody(judgementQuote) ||
    sanitizeMemoBody(t(`fieldMemoQuote.${quoteVariant}`)) ||
    null;

  const statsLine = [
    t("chipDuration", { minutes: meta.estimated_total_duration_minutes }),
    t("chipDistance", { km: meta.estimated_total_distance_km.toFixed(1) }),
    t(timeKey),
    t(paceKey),
  ].join(" · ");

  return (
    <section className={cn("max-w-[42rem]", className)} aria-label={t("dayPreviewAria")}>
      <div className="rounded-2xl border border-border/60 bg-card px-4 py-4 sm:px-5 sm:py-5">
        <header className="space-y-2 border-b border-border/40 pb-4">
          <h2 className="text-[var(--text-strong)] text-base font-semibold tracking-tight sm:text-lg">
            {t("fieldMemoCardTitle")}
          </h2>
          {subtitleText ? (
            <p className="text-muted-foreground text-[13px] leading-relaxed sm:text-sm">{subtitleText}</p>
          ) : null}
          <p className="text-foreground/90 text-[13px] font-medium tabular-nums sm:text-sm">{statsLine}</p>
        </header>

        <div className="grid grid-cols-1 gap-2.5 pt-4 sm:grid-cols-2 sm:gap-3">
          <MemoNote title={t("briefingSummaryTitle")} body={orientationBody} />
          <MemoNote title={t("briefingTipTitle")} body={prepBody} />
          <MemoNote title={t("briefingMovementTitle")} body={crowdBody} />
          <MemoNote title={t("briefingFinishTitle")} body={vibeBody} />
        </div>

        {fieldQuote ? (
          <blockquote className="border-border/50 mt-4 border-t pt-4">
            <p className="text-[var(--text-strong)] border-l-2 border-primary/35 pl-3 text-[13px] leading-relaxed sm:text-sm">
              “{fieldQuote}”
            </p>
          </blockquote>
        ) : null}
      </div>
    </section>
  );
}

function MemoNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/55 bg-background/40 px-3 py-2.5 sm:min-h-[5.5rem]">
      <p className="text-[var(--text-strong)] text-[12px] font-semibold leading-snug">{title}</p>
      <p className="text-muted-foreground mt-1.5 text-[12px] leading-relaxed sm:text-[13px]">{body}</p>
    </div>
  );
}
