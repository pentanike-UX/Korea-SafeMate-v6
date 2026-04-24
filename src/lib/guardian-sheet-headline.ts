/** 한줄 소개가 비어 있을 때 포스트 요약 등으로 시트/카드 히어로를 보강 */
export function resolveGuardianHeadlineWithPostFallback(
  guardianHeadline: string | null | undefined,
  postSummary: string | null | undefined,
): string {
  const h = guardianHeadline?.trim();
  if (h) return h;
  return postSummary?.trim() ?? "";
}

export function clampSheetHeadline(text: string, maxLen = 180): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}
