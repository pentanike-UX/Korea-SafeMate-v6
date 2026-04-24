/**
 * Post structured JSON (v1) — parse, serialize to legacy shells, bridge to detail render models.
 *
 * ## 상세 렌더 우선순위 (`resolvePracticalArticleRender` / `resolveRouteArticleRender`)
 * 1. **JSON 우선**: `post.structured_content`가 유효하고 템플릿이 일치하며, 블록으로 쓸 필드가 있으면 구조형 UI.
 * 2. **파싱 폴백**: JSON 없거나 비어 있으면 레거시 `body`의 한글 섹션 헤더(`parsePracticalTipDocument` / `parseRouteArticleDocument`).
 * 3. **평문 폴백**: 파싱도 실패하면 `body`를 문단 나열로만 표시.
 *
 * 가디언 루트 에디터 저장 시 `structured_content` + `serializeRoutePostToShellBody`로 `body`를 함께 채운다.
 */

import type {
  ContentPost,
  PostStructuredContentV1,
  PracticalTipBlockV1,
  PracticalTipStructuredContentV1,
  RoutePostStructuredContentV1,
} from "@/types/domain";
import { POST_STRUCTURED_CONTENT_VERSION } from "@/types/domain";
import { formatRouteSummaryMeta, practicalArticleShell, routeArticleShell } from "@/lib/post-seed-content-templates";
import { splitPostBodyLeadRest } from "@/lib/post-detail-body-split";
import type { PracticalTipParsed, RouteArticleParsed } from "@/lib/post-detail-structured-parse";
import { parsePracticalTipDocument, parseRouteArticleDocument } from "@/lib/post-detail-structured-parse";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseTipBlocks(raw: unknown): PracticalTipBlockV1[] {
  if (!Array.isArray(raw)) return [];
  const out: PracticalTipBlockV1[] = [];
  for (const x of raw) {
    if (!isRecord(x)) continue;
    const primary = typeof x.primary === "string" ? x.primary : typeof x.body === "string" ? x.body : "";
    if (!primary.trim()) continue;
    const secondary = typeof x.secondary === "string" ? x.secondary : undefined;
    out.push({ primary: primary.trim(), secondary: secondary?.trim() || undefined });
  }
  return out;
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
}

/** DB/API → typed envelope or null (invalid → null, do not throw). */
export function parsePostStructuredContent(raw: unknown): PostStructuredContentV1 | null {
  if (!isRecord(raw)) return null;
  const ver = raw.version;
  const template = raw.template;
  const data = raw.data;
  if (ver !== POST_STRUCTURED_CONTENT_VERSION) return null;
  if (!isRecord(data)) return null;

  if (template === "route_post") {
    const d: RoutePostStructuredContentV1 = {
      intro: typeof data.intro === "string" ? data.intro : "",
      route_summary: typeof data.route_summary === "string" ? data.route_summary : "",
      route_best_for: typeof data.route_best_for === "string" ? data.route_best_for : undefined,
      route_notes: typeof data.route_notes === "string" ? data.route_notes : "",
      narrative: typeof data.narrative === "string" ? data.narrative : "",
      closing: typeof data.closing === "string" ? data.closing : "",
      guardian_signature: typeof data.guardian_signature === "string" ? data.guardian_signature : "",
      spots: Array.isArray(data.spots) ? (data.spots as RoutePostStructuredContentV1["spots"]) : undefined,
    };
    return { version: POST_STRUCTURED_CONTENT_VERSION, template: "route_post", data: d };
  }

  if (template === "practical_tip_post") {
    const d: PracticalTipStructuredContentV1 = {
      context: typeof data.context === "string" ? data.context : "",
      one_line_conclusion: typeof data.one_line_conclusion === "string" ? data.one_line_conclusion : "",
      key_summary: typeof data.key_summary === "string" ? data.key_summary : undefined,
      tip_blocks: parseTipBlocks(data.tip_blocks),
      checklist: parseStringArray(data.checklist),
      field_tips: typeof data.field_tips === "string" ? data.field_tips : undefined,
      mistakes_notes: typeof data.mistakes_notes === "string" ? data.mistakes_notes : undefined,
      final_summary: typeof data.final_summary === "string" ? data.final_summary : "",
      guardian_signature: typeof data.guardian_signature === "string" ? data.guardian_signature : "",
    };
    return { version: POST_STRUCTURED_CONTENT_VERSION, template: "practical_tip_post", data: d };
  }

  return null;
}

export function practicalDataToParsed(data: PracticalTipStructuredContentV1): PracticalTipParsed {
  const conclusion = [data.one_line_conclusion.trim(), data.key_summary?.trim()].filter(Boolean).join("\n\n");
  const coreTips = data.tip_blocks.map((b) =>
    b.secondary?.trim() ? `${b.primary.trim()}\n\n${b.secondary.trim()}` : b.primary.trim(),
  );
  return {
    situation: data.context.trim() || undefined,
    conclusion: conclusion || undefined,
    coreTips,
    checklist: data.checklist,
    fieldTips: data.field_tips?.trim() || undefined,
    mistakes: data.mistakes_notes?.trim() || undefined,
    summary: data.final_summary.trim() || undefined,
    guardianLine: data.guardian_signature.trim() || undefined,
  };
}

export function routeDataToArticleParsed(data: RoutePostStructuredContentV1): RouteArticleParsed {
  return {
    routeSummary: data.route_summary.trim() || undefined,
    beforeYouGo: data.route_notes.trim() || undefined,
    narrative: data.narrative.trim() || undefined,
    routeClosing: data.closing.trim() || undefined,
    guardianLine: data.guardian_signature.trim() || undefined,
  };
}

function practicalParsedHasBlocks(p: PracticalTipParsed): boolean {
  return Boolean(
    p.situation ||
      p.conclusion ||
      p.coreTips.length ||
      p.checklist.length ||
      p.fieldTips ||
      p.mistakes ||
      p.summary ||
      p.guardianLine,
  );
}

/** Article detail: JSON → blocks | 헤더 파싱 → blocks | 평문. */
export function resolvePracticalArticleRender(
  structured: PostStructuredContentV1 | null | undefined,
  bodyText: string,
): { mode: "blocks"; data: PracticalTipParsed } | { mode: "plain"; text: string } {
  if (structured?.template === "practical_tip_post") {
    const data = practicalDataToParsed(structured.data);
    if (practicalParsedHasBlocks(data)) return { mode: "blocks", data };
  }
  const parsed = parsePracticalTipDocument(bodyText);
  if (parsed && practicalParsedHasBlocks(parsed)) return { mode: "blocks", data: parsed };
  return { mode: "plain", text: bodyText };
}

export function routeArticleParsedHasBlocks(p: RouteArticleParsed): boolean {
  return Boolean(
    p.routeSummary || p.beforeYouGo || p.narrative || p.routeClosing || p.guardianLine,
  );
}

/** 루트 상단 글: JSON → blocks | 헤더 파싱 → blocks | 평문. */
export function resolveRouteArticleRender(
  structured: PostStructuredContentV1 | null | undefined,
  restBody: string,
): { mode: "blocks"; data: RouteArticleParsed } | { mode: "plain"; text: string } {
  if (structured?.template === "route_post") {
    const data = routeDataToArticleParsed(structured.data);
    if (routeArticleParsedHasBlocks(data)) return { mode: "blocks", data };
  }
  const parsed = parseRouteArticleDocument(restBody);
  if (parsed && routeArticleParsedHasBlocks(parsed)) return { mode: "blocks", data: parsed };
  return { mode: "plain", text: restBody };
}

/** Legacy `body` 문자열 생성(검색·RSS·DB 호환). `spotCount`는 안내 문구에 사용. */
export function serializeRoutePostToShellBody(data: RoutePostStructuredContentV1, spotCount: number): string {
  const spotGuideLine =
    spotCount > 0
      ? `스팟별 상세는 지도·아래 카드 ${spotCount}곳에 정리했습니다. 각 카드에 할 일·추천 체류·다음으로 이어지는 포인트를 넣었습니다.`
      : "스팟별 상세는 아래 카드에서 확인할 수 있습니다.";
  return routeArticleShell({
    forWho: data.intro.trim() || "이 루트를 함께 걷고 싶은 분",
    routeSummary: data.route_summary.trim() || "",
    beforeYouGo: data.route_notes.trim() || "",
    introBody: data.narrative.trim() || "",
    spotGuideLine,
    closing: data.closing.trim() || "",
    guardianLine: data.guardian_signature.trim() || "",
  });
}

/** `이 포스트가 맞는 사람` 헤더 줄 제거 → 인트로 패널용 본문 */
export function stripRouteIntroLead(lead: string): string {
  const t = lead.trim();
  if (t.startsWith("이 포스트가 맞는 사람")) {
    return t.replace(/^이 포스트가 맞는 사람\s*\n?/, "").trim();
  }
  return t;
}

/** 가디언 루트 에디터 초안 — JSON 없으면 레거시 `body`에서 추론 */
export function inferRouteStructuredDraftFromPost(p: ContentPost): RoutePostStructuredContentV1 {
  if (p.structured_content?.template === "route_post") {
    const d = p.structured_content.data;
    return {
      ...d,
      spots: d.spots ?? [],
    };
  }
  const { lead, rest } = splitPostBodyLeadRest(p.body);
  const intro = stripRouteIntroLead(lead);
  const parsed = parseRouteArticleDocument(rest);
  const meta = p.route_journey?.metadata;
  return {
    intro,
    route_summary: parsed?.routeSummary ?? (meta ? formatRouteSummaryMeta(meta) : ""),
    route_best_for: "",
    route_notes: parsed?.beforeYouGo ?? "",
    narrative: parsed?.narrative ?? "",
    closing: parsed?.routeClosing ?? "",
    guardian_signature: parsed?.guardianLine ?? "",
    spots: [],
  };
}

export function serializePracticalTipToShellBody(data: PracticalTipStructuredContentV1): string {
  const coreTips = data.tip_blocks.map((b) => (b.secondary ? `${b.primary}\n${b.secondary}` : b.primary));
  while (coreTips.length < 3) {
    coreTips.push("작은 결정 하나를 줄여도 하루 피로도는 확 줄어듭니다.");
  }
  return practicalArticleShell({
    situation: data.context.trim() || "현장에서 작은 결정이 쌓일 때",
    conclusion: data.one_line_conclusion.trim() || data.key_summary?.trim() || "",
    coreTips: coreTips.slice(0, 8),
    checklist: data.checklist.length > 0 ? data.checklist : ["오늘 목표 지점을 2~3곳만 고정했는지"],
    fieldTips: data.field_tips?.trim() || data.one_line_conclusion || "",
    mistakes: data.mistakes_notes?.trim() || "",
    summary: data.final_summary.trim() || "",
    guardianLine: data.guardian_signature.trim() || "",
  });
}
