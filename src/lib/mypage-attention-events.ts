/** 헤더 계정 메뉴 등이 `/mypage` 읽음 처리 후 스냅샷을 다시 불러오도록 알립니다. */
export const MYPAGE_ATTENTION_UPDATED_EVENT = "safemate:attention-updated";

export function emitMypageAttentionUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MYPAGE_ATTENTION_UPDATED_EVENT));
}
