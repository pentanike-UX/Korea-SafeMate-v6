/**
 * 홈 히어로 `scopeNoteDetail`(부 노트)의 뷰포트 정책 — 서버 전용.
 *
 * `HOME_HERO_SCOPE_NOTE_SECONDARY_FROM_SM` (런타임/빌드 시점 env, `NEXT_PUBLIC_` 불필요)
 * - **의미**: `HomeAuxiliaryNoteHero`의 `secondaryFromSm`과 동일.
 * - `true`(기본): `sm` 미만에서 부 노트만 시각적으로 숨김 — 현재 브랜드 리듬.
 * - `false`: 모든 뷰포트에서 부 노트 표시 — 필수 고지·투명성 우선 시 스테이징/운영에서 전환.
 *
 * 스테이징에서만 끄려면 Vercel Preview/Staging에 `HOME_HERO_SCOPE_NOTE_SECONDARY_FROM_SM=false`만 설정.
 */
const ENV_KEY = "HOME_HERO_SCOPE_NOTE_SECONDARY_FROM_SM";

function parseSecondaryFromSm(raw: string | undefined): boolean {
  if (raw == null) return true;
  const v = raw.trim().toLowerCase();
  if (v === "") return true;
  if (v === "false" || v === "0" || v === "no" || v === "off") return false;
  if (v === "true" || v === "1" || v === "yes" || v === "on") return true;
  return true;
}

export function getHomeHeroScopeNoteSecondaryFromSm(): boolean {
  return parseSecondaryFromSm(process.env[ENV_KEY]);
}
