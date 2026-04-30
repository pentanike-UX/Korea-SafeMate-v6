/**
 * Naver Image Search 결과 후처리 — 성인·저품질·불명확 후보 제외.
 * (완벽한 필터는 불가; 제목·크기 휴리스틱)
 */

const ADULT_OR_NSFW = /성인|야동|만화책|19금|노출|전신사진|몸매|섹시|AV|성인용품/i;

/** 극단적으로 짧은 제목(의미 없는 스크랩) */
function tooVagueTitle(title: string): boolean {
  const t = title.replace(/\s+/g, "");
  return t.length > 0 && t.length < 4;
}

export function isDiscouragedNaverImageTitle(title: string): boolean {
  const t = title.trim();
  if (!t) return true;
  if (ADULT_OR_NSFW.test(t)) return true;
  if (tooVagueTitle(t)) return true;
  return false;
}

export function parseImageLinkHostname(link: string): string | undefined {
  try {
    return new URL(link).hostname;
  } catch {
    return undefined;
  }
}
