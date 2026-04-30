/**
 * 궁·랜드마크·광장 visual identity — 검색 쿼리·제목 필터·히어로 판별.
 */
import type { NaverPrimaryPlace, RouteSpot, SpotImagePlaceType } from "@/types/domain";
import { normalizePlaceTitle } from "@/lib/naver-place-similarity";
import { stripHtmlTitle } from "@/lib/naver-image-quality";

/** landmark/palace/plaza 갤러리에서 하드 제외(타이틀·링크 결합 검사 권장) */
export const HERITAGE_VISUAL_EXCLUDE =
  /맛집|카페\b|서촌|핫플|상권|블로그|기사|리뷰|식신|망고플레이트|광고|T\s*money|티머니|배달|음식|메뉴|디저트|베이커리|브런치|빵집|베이커리|와플|버거|치킨|삼겹살|회\b|초밥|김밥|술집|펍|바\b|라운지\s*바/i;

/** 상권·음식·홍보 성격 강한 패턴(추가) */
export const HERITAGE_VISUAL_EXCLUDE_EXTRA =
  /포장마차|야시장\s*맛집|미슐랭|예약\s*필수|할인|쿠폰|방문후기|체험단|협찬|원조\b|본점\b\s*맛집|줄서서|웨이팅\s*\d|테이크아웃/i;

export function titleFailsHeritageVisualIdentity(rawTitle: string, link: string): boolean {
  const t = stripHtmlTitle(rawTitle);
  const bundle = `${t} ${link}`;
  return HERITAGE_VISUAL_EXCLUDE.test(t) || HERITAGE_VISUAL_EXCLUDE_EXTRA.test(t) || HERITAGE_VISUAL_EXCLUDE.test(bundle);
}

const HERITAGE_POS =
  /정문|전경|궁궐|광장|한옥|기와|담장|성문|조선|왕조|전각|전각|루\b|주변\s*전경|야경|설경|단청|근정전|경회루|향원정|돌계단|광화문|경복궁|창덕궁|덕수궁|창경궁|세종대왕|이순신|동상|랜드마크/i;

const HERITAGE_NEG_WEIGHT =
  /거리\s*풍경\s*만|일반\s*상가|백화점|편의점\s*앞|버스\s*정류장\s*만/i;

/**
 * 히어로 후보: 장소 식별에 충분한지(정문·전경·광장 대표 등).
 */
export function isHeritageHeroStrongCandidate(
  c: { title: string; link?: string },
  spot: RouteSpot,
  placeType: SpotImagePlaceType,
): boolean {
  if (titleFailsHeritageVisualIdentity(c.title, c.link ?? "")) return false;
  const t = stripHtmlTitle(c.title);
  if (HERITAGE_NEG_WEIGHT.test(t)) return false;

  const rp = spot.real_place_name?.trim() ?? "";
  const tokens = rp.split(/\s+/).filter((w) => w.length >= 2);
  const tokenHit = tokens.some((w) => t.includes(w));
  if (tokenHit && HERITAGE_POS.test(t)) return true;
  if (tokenHit && /전경|정문|야경|동상|광장/.test(t)) return true;
  if (placeType === "palace" && /경복궁|창덕궁|덕수궁|창경궁|광화문|근정전|궁\b/.test(t)) return true;
  if (placeType === "plaza" && /광화문광장|세종|이순신|광장\s*전경/.test(t)) return true;
  if (placeType === "landmark" && /동상|기념물|조각상/.test(t)) return true;
  if (HERITAGE_POS.test(t) && tokenHit) return true;
  return false;
}

/** 시각 정체성 가중 점수 (이미지 후보 타이틀) */
export function heritageVisualIdentityScore(
  rawTitle: string,
  spot: RouteSpot,
  primary: NaverPrimaryPlace | null,
  placeType: SpotImagePlaceType,
): number {
  let s = 0;
  const t = stripHtmlTitle(rawTitle);
  if (titleFailsHeritageVisualIdentity(rawTitle, "")) return -150;

  const pt = primary ? normalizePlaceTitle(primary.title) : "";
  if (pt && t.includes(pt)) s += 55;
  const rp = spot.real_place_name?.trim() ?? "";
  if (rp) {
    const parts = rp.split(/\s+/).filter((w) => w.length >= 2);
    for (const w of parts.slice(0, 4)) {
      if (t.includes(w)) s += 18;
    }
  }

  if (/정문|전경|궁궐|광장\s*전경|야경|한옥|기와|담장|성문|근정전|경복궁|창덕궁/.test(t)) s += 42;
  if (/음식점|맛집|카페|상권|리뷰|메뉴|브런치|베이커리|초밥/.test(t)) s -= 120;
  if (/서촌|핫플|식신|망고플레이트|블로그|기사/.test(t)) s -= 95;

  if (placeType === "palace") {
    if (/경복궁|창덕|덕수|창경|궁궐|광화문/.test(t)) s += 35;
  }
  if (placeType === "plaza") {
    if (/광화문광장|세종|이순신|광장/.test(t)) s += 35;
  }

  return s;
}

function uniqShort(queries: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of queries) {
    const t = q.replace(/\s+/g, " ").trim();
    if (t.length < 3 || seen.has(t)) continue;
    seen.add(t);
    out.push(t.slice(0, 120));
  }
  return out;
}

/**
 * palace / landmark / plaza 전용 — 음식·실내 좌석 쿼리 없음.
 */
export function buildHeritageVisualQueries(
  spot: RouteSpot,
  primary: NaverPrimaryPlace | null,
  placeType: SpotImagePlaceType,
): string[] {
  const t = primary ? normalizePlaceTitle(primary.title) : "";
  const blob = [spot.real_place_name, spot.title, spot.spot_name].filter(Boolean).join(" ");
  const road = primary?.roadAddress?.trim();
  const dist = spot.district?.trim();
  const qs: string[] = [];

  if (placeType === "palace") {
    qs.push(
      "경복궁 광화문 정문",
      "경복궁 전경",
      "경복궁 근정전",
      "경복궁 한옥",
      "경복궁 야경",
      "경복궁 성문",
      "광화문 경복궁 정문 전경",
    );
    if (/창덕/.test(blob)) {
      qs.push("창덕궁 전경", "창덕궁 후원");
    }
    if (/덕수/.test(blob)) {
      qs.push("덕수궁 전경", "덕수궁 중화전");
    }
    if (t) {
      qs.push(`${t} 정문`, `${t} 전경`, `${t} 야경`, `${t} 내부`);
    }
    if (road) qs.push(`${t || "경복궁 광화문"} ${road}`);
  } else if (placeType === "plaza") {
    qs.push(
      "광화문광장 전경",
      "광화문광장 세종대왕 동상",
      "광화문광장 이순신장군 동상",
      "세종대로 광화문광장",
    );
    if (t) qs.push(`${t} 전경`, `${t} 야경`);
    if (/세종/.test(blob)) qs.push("세종대왕 동상 광화문 전경");
    if (/이순신/.test(blob)) qs.push("이순신장군 동상 광화문");
  } else if (placeType === "landmark") {
    if (t) qs.push(`${t} 전경`, `${t} 야경`, `${t} 정면`);
    if (/이순신/.test(blob)) qs.push("광화문 이순신장군 동상 전경");
    if (/세종/.test(blob)) qs.push("광화문 세종대왕 동상 전경");
    if (road) qs.push(`${t} ${road}`);
  }

  if (dist && t) qs.push(`${t} ${dist}`);

  return uniqShort(qs).slice(0, 18);
}
