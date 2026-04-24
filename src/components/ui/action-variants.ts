/**
 * Shared visual language: primary = commit, outline = context-preserving preview / sheet entry,
 * ghost/link = light affordances. Use with `Button` / `TextActionLink`.
 */
export const actionPrimaryButtonClass = "rounded-xl font-semibold";
export const actionDrawerTriggerButtonClass = "rounded-xl font-semibold";
export const actionSecondaryOutlineClass = "rounded-xl font-semibold border-border/80";
/** Inline text actions (약관, 더 알아보기) — use with `Button variant="link"` or plain `Link`. */
export const actionTextLinkClass =
  "text-primary font-semibold underline-offset-4 hover:underline";

/**
 * 그리드·리스트 카드 하단 액션 (RoutePostCard 기준 36px, 모바일 타이포 통일).
 * `Button` / `GuardianRequestOpenTrigger` / 시트 트리거에 `className`으로 합성해 사용.
 */
export const listCardActionButtonClass =
  "h-9 min-h-9 rounded-xl px-3 text-xs font-semibold sm:text-sm";

/** 카드 본문 아래 메타 한 덩어리(스팟 수·작성자·지역 등). */
export const listCardMetaBlockClass = "text-muted-foreground space-y-1 text-xs leading-snug";
