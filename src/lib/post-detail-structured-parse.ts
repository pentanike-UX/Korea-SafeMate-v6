/**
 * Parse seed-template post bodies (`practicalArticleShell`, `routeArticleShell`) into UI sections.
 * Returns null when the text does not look structured (fallback to plain prose).
 */

export type PracticalTipParsed = {
  situation?: string;
  conclusion?: string;
  coreTips: string[];
  checklist: string[];
  fieldTips?: string;
  mistakes?: string;
  summary?: string;
  guardianLine?: string;
  /** Unrecognized trailing content */
  remainder?: string;
};

export type RouteArticleParsed = {
  routeSummary?: string;
  beforeYouGo?: string;
  /** Intro + spot guide line (no section headers) */
  narrative?: string;
  routeClosing?: string;
  guardianLine?: string;
  remainder?: string;
};

const PRACTICAL_HEADERS: { key: keyof PracticalTipParsed; labels: string[] }[] = [
  { key: "situation", labels: ["이 팁이 필요한 상황"] },
  { key: "conclusion", labels: ["먼저 결론", "읽기 전 한 줄", "핵심 요약"] },
  { key: "coreTips", labels: ["핵심 팁"] },
  { key: "checklist", labels: ["체크 포인트"] },
  { key: "fieldTips", labels: ["실전 팁"] },
  { key: "mistakes", labels: ["자주 하는 실수·주의", "자주 하는 실수", "주의"] },
  { key: "summary", labels: ["실패 줄이는 요약"] },
  { key: "guardianLine", labels: ["가디언 한 줄 제안"] },
];

const ROUTE_HEADERS: { key: keyof RouteArticleParsed; labels: string[] }[] = [
  { key: "routeSummary", labels: ["루트 요약"] },
  { key: "beforeYouGo", labels: ["먼저 알고 가면 좋은 점"] },
  { key: "routeClosing", labels: ["루트 마무리"] },
  { key: "guardianLine", labels: ["가디언 한 줄 제안"] },
];

function headerKeyForLine(
  line: string,
  defs: { key: string; labels: string[] }[],
): string | null {
  const t = line.trim();
  for (const d of defs) {
    if (d.labels.includes(t)) return d.key;
  }
  return null;
}

function sliceByHeaders(
  text: string,
  defs: { key: string; labels: string[] }[],
): Map<string, string> | null {
  const lines = text.split("\n");
  const hits: { key: string; line: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const k = headerKeyForLine(lines[i]!, defs);
    if (k) hits.push({ key: k, line: i });
  }
  if (hits.length < 2) return null;

  const map = new Map<string, string>();
  for (let h = 0; h < hits.length; h++) {
    const start = hits[h]!.line + 1;
    const end = h + 1 < hits.length ? hits[h + 1]!.line : lines.length;
    const chunk = lines.slice(start, end).join("\n").trim();
    map.set(hits[h]!.key, chunk);
  }
  return map;
}

/** Numbered lines `1. ...` → tip items; continuations merge into previous item */
export function parseNumberedTipBlocks(raw: string): string[] {
  const lines = raw.split("\n");
  const items: string[] = [];
  let cur = "";
  for (const line of lines) {
    const m = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    if (m) {
      if (cur.trim()) items.push(cur.trim());
      cur = m[2] ?? "";
    } else {
      cur = cur ? `${cur}\n${line}` : line;
    }
  }
  if (cur.trim()) items.push(cur.trim());
  return items.filter(Boolean);
}

export function parseChecklistItems(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[·•\-*]\s+/, "").trim())
    .filter(Boolean);
}

export function parsePracticalTipDocument(text: string): PracticalTipParsed | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const rawMap = sliceByHeaders(trimmed, PRACTICAL_HEADERS);
  if (!rawMap) return null;

  const out: PracticalTipParsed = { coreTips: [], checklist: [] };

  for (const { key } of PRACTICAL_HEADERS) {
    const chunk = rawMap.get(key);
    if (!chunk) continue;

    if (key === "coreTips") {
      const tips = parseNumberedTipBlocks(chunk);
      out.coreTips = tips.length > 0 ? tips : chunk.trim() ? [chunk.trim()] : [];
    } else if (key === "checklist") {
      out.checklist = parseChecklistItems(chunk);
    } else if (key === "situation") out.situation = chunk;
    else if (key === "conclusion") out.conclusion = chunk;
    else if (key === "fieldTips") out.fieldTips = chunk;
    else if (key === "mistakes") out.mistakes = chunk;
    else if (key === "summary") out.summary = chunk;
    else if (key === "guardianLine") out.guardianLine = chunk;
  }

  const hasContent =
    out.situation ||
    out.conclusion ||
    out.coreTips.length ||
    out.checklist.length ||
    out.fieldTips ||
    out.mistakes ||
    out.summary ||
    out.guardianLine;
  if (!hasContent) return null;
  return out;
}

export function parseRouteArticleDocument(text: string): RouteArticleParsed | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const rawMap = sliceByHeaders(trimmed, ROUTE_HEADERS);
  if (!rawMap) return null;

  const lines = trimmed.split("\n");
  const hits: { key: string; line: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const k = headerKeyForLine(lines[i]!, ROUTE_HEADERS);
    if (k) hits.push({ key: k, line: i });
  }

  let narrative: string | undefined;
  const idxBefore = hits.find((h) => h.key === "beforeYouGo");
  const idxClose = hits.find((h) => h.key === "routeClosing");
  if (idxBefore && idxClose && idxClose.line > idxBefore.line) {
    const start = idxBefore.line + 1;
    const end = idxClose.line;
    const mid = lines.slice(start, end).join("\n").trim();
    if (mid) narrative = mid;
  }

  const out: RouteArticleParsed = {
    routeSummary: rawMap.get("routeSummary"),
    beforeYouGo: rawMap.get("beforeYouGo"),
    narrative,
    routeClosing: rawMap.get("routeClosing"),
    guardianLine: rawMap.get("guardianLine"),
  };
  const has =
    out.routeSummary || out.beforeYouGo || out.narrative || out.routeClosing || out.guardianLine;
  if (!has) return null;
  return out;
}

const NEXT_CUE_MARKER = "다음 장소로 이어지는 포인트";

export function splitSpotBodyAndNextCue(body: string): { main: string; nextCue: string | null } {
  const t = body.trim();
  if (!t) return { main: "", nextCue: null };
  const idx = t.indexOf(NEXT_CUE_MARKER);
  if (idx === -1) return { main: t, nextCue: null };
  const main = t.slice(0, idx).trim().replace(/\n+$/, "");
  const nextPart = t.slice(idx).trim();
  return { main, nextCue: nextPart.length > NEXT_CUE_MARKER.length ? nextPart : null };
}
