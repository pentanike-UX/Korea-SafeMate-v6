import type { RouteSpot } from "@/types/domain";
import { freeClassificationTitle } from "@/lib/route-free-classification";

function norm(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** 브랜드·공식 상호가 접힘 카피에 섞이지 않도록 */
const BRAND_OR_CHAIN =
  /블루보틀|스타벅스|투썸|이디야|파스쿠찌|폴바셋|메가커피|컴포즈|할리스|바나프레소|공차|요거프레소|빽다방/i;

const STORE_SUFFIX = /강남점|역삼점|종로점|본점|직영점|신사점|홍대점|명동점|잠실점|코엑스|\d+호점/;

const STREET_TITLE = /테헤란로|언주로|강남대로|삼성로|압구정로/;

function inferVibeRole(spot: RouteSpot): "photo" | "rest" | "destination" {
  const text = `${spot.title} ${spot.place_name} ${spot.theme_reason ?? ""} ${spot.what_to_do ?? ""}`;
  if (/포토|야경|전망|인생샷|촬영|뷰|랜드마크/.test(text)) return "photo";
  if (/카페|커피|휴식|디저트|베이커리|쉬어/.test(text)) return "rest";
  return "destination";
}

/**
 * 상호·실명·거리명이 그대로 드러나는지(접힘 문구로 부적합)
 */
export function leaksOfficialVenueLabel(raw: string | undefined, spot: RouteSpot): boolean {
  if (!raw?.trim()) return false;
  const t = raw.trim();
  const n = norm(t);
  const rp = spot.real_place_name?.trim();
  if (rp && n.includes(norm(rp))) return true;
  if (BRAND_OR_CHAIN.test(t)) return true;
  if (STORE_SUFFIX.test(t)) return true;
  if (STREET_TITLE.test(t) && /카페거리|상권|보행로\s*$/.test(t)) return true;
  const pn = spot.place_name?.trim();
  if (pn && norm(pn) === n) return true;
  return false;
}

/** 무료 접힘 제목 — 분위기형 장소 분류명(실명·상호 없음) */
export function freeTierMoodTitle(spot: RouteSpot): string {
  return freeClassificationTitle(spot);
}

/**
 * @deprecated 무료 티저는 UI에서 `inferFreeArchetype` + i18n `freeArchetypeTeaser.*` 사용
 */
export function freeTierMoodSubtitle(spot: RouteSpot): string | null {
  const tr = spot.theme_reason?.split(/[\n]/)[0]?.trim();
  if (tr && !leaksOfficialVenueLabel(tr, spot) && tr.length <= 72) {
    return tr;
  }
  return null;
}

export function atmospherePlaybookTitle(spot: RouteSpot): string {
  const tryLines = [
    spot.theme_reason?.split(/[\n。．]/)[0]?.trim(),
    spot.recommend_reason?.split(/[\n。．]/)[0]?.trim(),
    spot.short_description?.split(/\n/)[0]?.trim(),
  ];

  for (const line of tryLines) {
    if (!line || line.length < 4) continue;
    if (line.length > 52) continue;
    if (leaksOfficialVenueLabel(line, spot)) continue;
    return line.slice(0, 48);
  }

  const d = spot.district?.trim() ?? "";
  const role = inferVibeRole(spot);
  if (role === "photo") {
    return d ? `${d} 근처 포토·야경 마무리 구간` : "야경·전망 포인트 구간";
  }
  if (role === "rest") {
    return d ? `${d} 근처 카페에서 짧게 쉬는 구간` : "카페에서 호흡 고르는 구간";
  }
  return d ? `${d} 명소·동선 구간` : "산책·명소 구간";
}

/** @deprecated atmospherePlaybookTitle 사용 */
export function roughPlaybookSpotTitle(spot: RouteSpot): string {
  return atmospherePlaybookTitle(spot);
}

/**
 * 접힘 한 줄 상황 — 브랜드·실명이 없을 때만 본문에서 발췌
 */
export function collapsedSituationLine(spot: RouteSpot): string | null {
  const sd = spot.short_description?.trim();
  if (sd) {
    const first = sd.split(/\n/)[0]?.trim() ?? "";
    if (first.length >= 8 && !leaksOfficialVenueLabel(first, spot)) {
      return first.length > 88 ? `${first.slice(0, 85)}…` : first;
    }
  }
  const th = spot.theme_reason?.trim();
  if (th && !leaksOfficialVenueLabel(th, spot)) {
    return th.length > 88 ? `${th.slice(0, 85)}…` : th;
  }
  return null;
}

/** 유료 펼침 — 실제 장소명 */
export function premiumSpotPlaceTitle(spot: RouteSpot): string {
  return (
    spot.real_place_name?.trim() ||
    spot.display_name?.trim() ||
    spot.spot_name?.trim() ||
    spot.title?.trim() ||
    spot.place_name?.trim() ||
    ""
  );
}

/** 펼침 시 한 줄 주소 표시 */
export function premiumSpotAddressLine(spot: RouteSpot): string | null {
  const road = spot.road_address?.trim();
  const line = spot.address_line?.trim() || spot.address?.trim();
  return road || line || null;
}
