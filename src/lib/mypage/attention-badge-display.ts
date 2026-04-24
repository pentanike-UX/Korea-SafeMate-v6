/** UI 표시용 상한(실제 카운트·집계 값은 변경하지 않음). */
export const ATTENTION_COUNT_DISPLAY_CAP = 99;
/** 좁은 칩(LNB·세그먼트 탭 등)용 — 레이아웃이 허용하면 `ATTENTION_COUNT_DISPLAY_CAP` 사용. */
export const ATTENTION_COUNT_DISPLAY_CAP_COMPACT = 9;

export function formatAttentionCountForDisplay(
  count: number,
  cap?: number,
): string {
  const c = cap ?? ATTENTION_COUNT_DISPLAY_CAP;
  if (count < 1) return "";
  return count > c ? `${c}+` : String(count);
}

/** 스크린 리더에 실제 건수를 포함(표시는 cap일 수 있음). */
export function attentionCountAccessibleLabel(description: string, count: number): string {
  return `${description} (${count})`;
}
