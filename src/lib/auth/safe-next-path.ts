/**
 * OAuth `next` / post-login redirect — open redirect 방지를 위해 상대 경로만 허용합니다.
 * `null`이면 호출측에서 기본 경로로 대체합니다.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (raw == null || raw === "") return null;
  const s = raw.trim();
  if (!s.startsWith("/") || s.startsWith("//")) return null;
  return s;
}
