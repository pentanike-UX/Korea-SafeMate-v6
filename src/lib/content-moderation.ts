/**
 * 서버 전용 콘텐츠 모더레이션 — 욕설·음란 키워드 감지.
 * 클라이언트 번들에 포함되지 않도록 server action / persist 에서만 import.
 */

const BLOCKED_PATTERNS: RegExp[] = [
  // ── 욕설 ──────────────────────────────────────────────────
  /씨발|시발|씨바|시바/,
  /개새끼|개세끼|개씨/,
  /병신|븅신|빙신/,
  /ㅅㅂ|ㅂㅅ|ㅈㄹ|ㅁㅊ/,
  /지랄|지럴/,
  /새끼|세끼/,
  /존나|졌나|좆나/,
  /닥쳐|닥처/,
  /꺼져|꺼저/,
  /미친|미쳤|미칫/,
  /바보|멍청|멍텅/,
  /죽어|죽여|죽을/,
  /ㄱㅅㄲ|ㄷㅊ|ㄲㅈ/,
  // ── 음란 ──────────────────────────────────────────────────
  /섹스|색스|sex/i,
  /포르노|포르나|porn/i,
  /야동|야설/,
  /성관계|성행위|성교/,
  /강간|성폭행|성추행/,
  /자위|오르가즘/,
  /18금|19금|성인물/,
  /xxx|adult\s?content/i,
  // ── 스팸·사기 ──────────────────────────────────────────────
  /대출|카드론|불법대출/,
  /도박|배팅|베팅사이트/,
];

export interface ModerationResult {
  blocked: boolean;
  /** 감지된 패턴 소스 목록 (로깅용) */
  reasons: string[];
}

/**
 * 제목·요약·본문·태그를 합쳐 금지 키워드를 스캔.
 * blocked=true 이면 status를 "blocked"로 저장해야 함.
 */
export function moderatePostContent(fields: {
  title?: string;
  summary?: string;
  body?: string;
  tags?: string[];
  route_highlights?: string[];
}): ModerationResult {
  const text = [
    fields.title ?? "",
    fields.summary ?? "",
    fields.body ?? "",
    ...(fields.tags ?? []),
    ...(fields.route_highlights ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const reasons: string[] = [];
  for (const pat of BLOCKED_PATTERNS) {
    if (pat.test(text)) {
      reasons.push(pat.source);
    }
  }

  return { blocked: reasons.length > 0, reasons };
}
