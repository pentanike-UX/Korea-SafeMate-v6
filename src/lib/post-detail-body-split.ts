/**
 * Block spacing between paragraphs in post detail reading flow (Tailwind `space-y`).
 */
export const POST_DETAIL_PARAGRAPH_STACK = "space-y-5 sm:space-y-6";

/** Shorter stack for tips / secondary blurbs inside cards */
export const POST_DETAIL_PARAGRAPH_STACK_COMPACT = "space-y-3 sm:space-y-4";

const PROSE_PRELINE = "whitespace-pre-line leading-relaxed";

/** Main column body (article & route `rest`) */
export const POST_DETAIL_PROSE_P_MAIN = `text-foreground text-[15px] ${PROSE_PRELINE} sm:text-base`;

/** Spot embedded / sheet body */
export const POST_DETAIL_PROSE_P_SPOT = `text-foreground text-sm ${PROSE_PRELINE} sm:text-[15px]`;

/** Compact blurbs (recommend reason, photo tip, caution) */
export const POST_DETAIL_PROSE_P_COMPACT = `text-foreground text-sm ${PROSE_PRELINE}`;

/**
 * Split display paragraphs on blank lines (`\n\n` or more). Single newlines stay inside one block (`pre-line`).
 */
export function splitPostBodyParagraphs(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const parts = t.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [t];
}

/**
 * Split post body into a leading "intro" paragraph and the remainder.
 * Uses first `\n\n`-delimited block when present; otherwise whole string is lead if non-empty.
 */
export function splitPostBodyLeadRest(body: string): { lead: string; rest: string } {
  const trimmed = body.trim();
  if (!trimmed) return { lead: "", rest: "" };
  const idx = trimmed.indexOf("\n\n");
  if (idx === -1) return { lead: trimmed, rest: "" };
  const lead = trimmed.slice(0, idx).trim();
  const rest = trimmed.slice(idx + 2).trim();
  return { lead, rest };
}
