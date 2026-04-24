/** Mock/표시용: 한국어 상대 시각 문구 → 일본어 (시드·쿠키 리뷰 공통) */
const KO_TO_JA: Record<string, string> = {
  지난달: "先月",
  "5주 전": "5週間前",
  "2달 전": "2ヶ月前",
  "3달 전": "3ヶ月前",
  "4달 전": "4ヶ月前",
  "2주 전": "2週間前",
  "3주 전": "3週間前",
  "1주 전": "1週間前",
  "이번 주": "今週",
  "방금 전": "さきほど",
  방금: "たった今",
};

export function timeLabelJaFromKo(ko: string | undefined): string | undefined {
  if (!ko) return undefined;
  return KO_TO_JA[ko];
}
