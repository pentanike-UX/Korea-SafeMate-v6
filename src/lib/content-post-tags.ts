/**
 * Post tag 표시 정규화 유틸.
 *
 * 포맷 설명 노이즈 태그("루트", "루트포함", "하이브리드 루트" 등)를
 * 카드/목록 표시에서 단일 "Route" 뱃지로 통폐합한다.
 * DB 원본 데이터는 변경하지 않는다.
 */

const ROUTE_NOISE_RE = /^(루트포함|루트|하이브리드\s*루트|하이브리드루트|route|hybrid\s*route|sample)$/i;

/**
 * 노이즈 태그를 필터링하고 라우트 관련 태그가 있으면 "Route"로 단일 통폐합.
 * 원본 배열 순서는 유지하고, 통폐합된 "Route"는 맨 앞에 삽입.
 */
export function normalizeDisplayTags(tags: readonly string[]): string[] {
  let hasRouteNoise = false;
  const clean: string[] = [];
  for (const t of tags) {
    if (ROUTE_NOISE_RE.test(t.trim())) {
      hasRouteNoise = true;
    } else {
      clean.push(t);
    }
  }
  if (hasRouteNoise) clean.unshift("Route");
  return clean;
}
