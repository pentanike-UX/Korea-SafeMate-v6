/**
 * 가디언 표시 이름 단일 소스 — `mg01`…`mg15` ↔ 프로필 이미지 인덱스(profile_XX)와 1:1.
 * 이미지로 성별을 추정하지 않고, 중성적·자연스러운 한글 이름으로 통일합니다.
 * 수정 시 이 객체만 편집하면 시드 프로필·포스트 작성자명에 반영됩니다.
 */
export const GUARDIAN_DISPLAY_NAME_BY_USER_ID: Record<string, string> = {
  mg01: "김민준",
  mg02: "이서연",
  mg03: "최서윤",
  mg04: "최지우",
  mg05: "오하윤",
  mg06: "서지원",
  mg07: "유민서",
  mg08: "수아",
  mg09: "서준",
  mg10: "박도윤",
  mg11: "김건우",
  mg12: "임태윤",
  mg13: "이예준",
  mg14: "김서호",
  mg15: "김시우",
};

export function resolveGuardianDisplayName(userId: string, legacyFallback?: string): string {
  const mapped = GUARDIAN_DISPLAY_NAME_BY_USER_ID[userId];
  if (mapped) return mapped;
  return legacyFallback?.trim() || userId;
}
