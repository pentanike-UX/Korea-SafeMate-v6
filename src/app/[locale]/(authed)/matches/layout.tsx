/** 레거시 `/matches` 경로는 `/mypage/matches`로 리다이렉트 — 별도 크롬 없음 */
export default function LegacyMatchesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
