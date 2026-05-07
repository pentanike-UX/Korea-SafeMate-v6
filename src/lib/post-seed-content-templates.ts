import type { ContentPost, RouteJourneyMetadata } from "@/types/domain";

export function formatRouteSummaryMeta(m: RouteJourneyMetadata): string {
  const mode = m.transport_mode === "walk" ? "도보" : m.transport_mode === "car" ? "차량" : "도보·차 병행";
  const diff = m.difficulty === "easy" ? "가벼움" : m.difficulty === "moderate" ? "보통" : "활동적";
  const tod = m.recommended_time_of_day;
  const todK = tod === "flexible" ? "시간대 자유" : tod;
  return `예상 ${m.estimated_total_duration_minutes}분 전후 · 약 ${m.estimated_total_distance_km}km · ${mode} · 시간대 ${todK} · 난이도 ${diff}${m.night_friendly ? " · 밤에도 사람 있음" : ""}`;
}

/** 본문은 줄바꿈 문단 — 마크다운 미파싱 UI에 맞춤 */
export function routeArticleShell(parts: {
  forWho: string;
  routeSummary: string;
  beforeYouGo: string;
  introBody: string;
  spotGuideLine: string;
  closing: string;
  guardianLine: string;
}): string {
  return [
    "이 포스트가 맞는 사람",
    parts.forWho,
    "",
    "루트 요약",
    parts.routeSummary,
    "",
    "먼저 알고 가면 좋은 점",
    parts.beforeYouGo,
    "",
    parts.introBody.trim(),
    "",
    parts.spotGuideLine,
    "",
    "루트 마무리",
    parts.closing,
    "",
    "가디언 한 줄 제안",
    parts.guardianLine,
  ].join("\n");
}

export function practicalArticleShell(parts: {
  situation: string;
  conclusion: string;
  coreTips: string[];
  checklist: string[];
  fieldTips: string;
  mistakes: string;
  summary: string;
  guardianLine: string;
}): string {
  const tips = parts.coreTips.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const check = parts.checklist.map((c) => `· ${c}`).join("\n");
  return [
    "이 팁이 필요한 상황",
    parts.situation,
    "",
    "먼저 결론",
    parts.conclusion,
    "",
    "핵심 팁",
    tips,
    "",
    "체크 포인트",
    check,
    "",
    "실전 팁",
    parts.fieldTips,
    "",
    "자주 하는 실수·주의",
    parts.mistakes,
    "",
    "실패 줄이는 요약",
    parts.summary,
    "",
    "가디언 한 줄 제안",
    parts.guardianLine,
  ].join("\n");
}

function inferSituation(p: ContentPost): string {
  const t = `${p.title} ${p.summary} ${p.tags.join(" ")}`;
  if (/첫|처음|입국/.test(t)) return "서울·한국 첫 방문 직후, 이동 흐름과 습관을 빠르게 맞추고 싶을 때";
  if (/밤|야간|택시/.test(t)) return "야간 이동·승차·안전이 걱정될 때";
  if (/카페|식사|음식/.test(t)) return "식사·카페 선택과 대기, 주문이 부담일 때";
  if (/사진|촬영/.test(t)) return "촬영 예절과 통행을 동시에 챙기고 싶을 때";
  if (/가족|아이/.test(t)) return "가족 동행으로 속도·휴게 리듬을 맞춰야 할 때";
  return "현장에서 작은 결정이 쌓여 피로로 이어지기 쉬울 때";
}

function defaultMistakes(p: ContentPost): string {
  return "표지판을 급하게 지나치거나, 통행 중 스마트폰만 보다 보면 방향이 자주 흔들립니다. 짧게 멈춰 한 번에 확인하는 습관이 도움이 됩니다.";
}

/** 비샘플 아티클 포스트를 실용 팁 템플릿으로 감쌈(기존 본문은 핵심 팁에 흡수) */
export function wrapNonSamplePracticalBody(p: ContentPost): string {
  const paras = p.body
    .split(/\n\s*\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const coreFromBody = paras.length > 0 ? paras : [p.summary || "현장에서 자주 묻는 지점을 짧게 정리했습니다."];
  const coreTips = coreFromBody.slice(0, 5);
  while (coreTips.length < 3) {
    coreTips.push("여행 중에는 ‘한 번에 하나’만 결정하면 피로가 줄어듭니다.");
  }
  const checklist = [
    "오늘 목표 지점을 2~3곳만 고정했는지",
    "화장실·물·그늘 중 급한 것을 먼저 채웠는지",
    "이동 중에는 큰 길·랜드마크를 기준으로 설명했는지",
  ];
  return practicalArticleShell({
    situation: inferSituation(p),
    conclusion: p.summary || coreTips[0]!,
    coreTips,
    checklist,
    fieldTips: paras.slice(0, 2).join("\n") || p.summary,
    mistakes: defaultMistakes(p),
    summary: `${p.title} — ${p.summary}`.slice(0, 160),
    guardianLine: `${p.author_display_name}: 오늘 컨디션에 맞춰 속도만 조절해도 체감이 달라집니다.`,
  });
}

export function normalizeNonSamplePostBody(p: ContentPost): ContentPost {
  if (p.is_sample) return p;
  return { ...p, body: wrapNonSamplePracticalBody(p) };
}
