import type { ContentPost, RouteSpot } from "@/types/domain";

const MIN_TITLE = 2;
const MIN_SUMMARY = 4;
const MIN_BLOCK = 15;
const MIN_SPOT_FIELD = 8;
const MIN_SPOT_BODY = 12;

function countBodyBlocks(body: string): number {
  return body
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= MIN_BLOCK).length;
}

/** 불릿·번호 줄을 팁 블록으로 간주 */
function countTipLikeLines(body: string): number {
  const lines = body.split("\n").map((l) => l.trim()).filter((l) => l.length >= MIN_BLOCK);
  const marked = lines.filter((l) => /^[-*•·]/.test(l) || /^\d+[.)]\s/.test(l));
  return Math.max(marked.length, countBodyBlocks(body));
}

function spotIsSubstantive(s: RouteSpot): boolean {
  const sd = s.short_description.trim().length;
  const b = s.body.trim().length;
  const rr = s.recommend_reason.trim().length;
  return sd >= MIN_SPOT_FIELD || b >= MIN_SPOT_BODY || rr >= MIN_SPOT_FIELD;
}

function countSubstantiveSpots(spots: RouteSpot[]): number {
  return spots.filter(spotIsSubstantive).length;
}

function isPracticalKind(post: ContentPost): boolean {
  return post.kind === "practical" || post.kind === "local_tip";
}

export type AiMetaGateReason =
  | "title"
  | "summary"
  | "content"
  | "spots"
  | "tips"
  | "ok";

export function canRequestAiMetaSuggestion(post: ContentPost): { ok: true } | { ok: false; reason: AiMetaGateReason; hint: string } {
  if (!post.title.trim() || post.title.trim().length < MIN_TITLE) {
    return { ok: false, reason: "title", hint: "제목을 입력해 주세요." };
  }
  if (!post.summary.trim() || post.summary.trim().length < MIN_SUMMARY) {
    return { ok: false, reason: "summary", hint: "한 줄 소개를 입력해 주세요." };
  }

  const spots = post.route_journey?.spots ?? [];
  const multiSpot = spots.length >= 2;
  const practical = isPracticalKind(post);

  if (practical) {
    const tips = countTipLikeLines(post.body);
    if (tips < 2) {
      return {
        ok: false,
        reason: "tips",
        hint: "실용 팁형은 본문에 팁·문단을 2개 이상 채워 주세요. (빈 줄로 구분하거나 •/번호 목록을 쓰면 인식됩니다.)",
      };
    }
    return { ok: true };
  }

  if (multiSpot) {
    const filled = countSubstantiveSpots(spots);
    if (filled < 2) {
      return {
        ok: false,
        reason: "spots",
        hint: "루트형은 스팟 2곳 이상에 짧은 설명·본문·추천 이유 중 하나씩 채워 주세요.",
      };
    }
    return { ok: true };
  }

  const blocks = countBodyBlocks(post.body);
  const spotSingle = countSubstantiveSpots(spots);
  if (blocks < 2 && spotSingle < 2) {
    return {
      ok: false,
      reason: "content",
      hint: "본문을 빈 줄로 나눈 핵심 문단 2개 이상, 또는 스팟 설명을 2개 이상 채워 주세요.",
    };
  }

  return { ok: true };
}
