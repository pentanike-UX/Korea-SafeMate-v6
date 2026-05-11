/**
 * 가디언 온라인 판정 — 단일 소스.
 * `last_seen_at`:
 *  - 센티넬 "mock:online"  → 항상 온라인 (mock 시드 호환)
 *  - ISO timestamptz, now() - 5분 이내 → 온라인
 *  - 그 외 (null/undefined/오래된 값) → 오프라인
 */

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function isGuardianOnline(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  if (lastSeenAt === "mock:online") return true;
  const ts = new Date(lastSeenAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < ONLINE_WINDOW_MS;
}

/** 프로필 진입점 노출 플래그 — `"0"` 이면 hero/aside 등에서 숨김 */
export function isInquireNowOnProfileEnabled(): boolean {
  return process.env.NEXT_PUBLIC_INQUIRE_NOW_ON_PROFILE !== "0";
}
