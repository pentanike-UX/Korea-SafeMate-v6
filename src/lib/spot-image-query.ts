/**
 * 하루웨이 스팟별 Naver 이미지 검색 쿼리 빌더.
 *
 * 우선순위:
 * 1. spot.image_query (에디터/AI가 명시적으로 설정)
 * 2. 실제 장소명 + 지역 (spot_name/display + district / 주소)
 * 3. 장소명 + 카테고리 + 실용 키워드 (입구·창가 등)
 * 4. 지역 + 랜드마크/타입 키워드
 * 5. 장소명 + 목적 접미사 (기존 폴백)
 */
import type { RouteSpot } from "@/types/domain";

/** 스팟 역할에 따른 이미지 목적 suffix */
function imageGoalSuffix(spot: RouteSpot): string {
  const text = [spot.title, spot.place_name, spot.what_to_do, spot.theme_reason]
    .filter(Boolean)
    .join(" ");

  if (/포토|사진|뷰|전망|촬영|인생샷/.test(text)) return "포토스팟";
  if (/카페|커피|베이커리|디저트/.test(text)) return "카페 창가";
  if (/공원|숲|자연|산책/.test(text)) return "공원 산책";
  if (/박물관|전시|갤러리/.test(text)) return "내부 전시";
  if (/맛집|식당|음식/.test(text)) return "음식점 외관";
  return "외관"; // 기본값 — 장소 입구·외관
}

/**
 * 주소에서 구·동·읍 단위 추출 시도.
 * "서울특별시 강남구 역삼동" → "강남구 역삼동"
 */
export function extractDistrictFromAddress(address?: string): string | null {
  if (!address) return null;
  const m = address.match(/([가-힣]+구\s*[가-힣]+동)|([가-힣]+구)|([가-힣]+읍|[가-힣]+면)/);
  return m ? m[0].trim() : null;
}

/**
 * 스팟의 Naver 이미지 검색 쿼리를 결정합니다.
 *
 * @param spot RouteSpot 데이터
 * @param regionSlug 포스트 region slug (폴백용)
 */
/** 카드·alt용 표시명 */
export function spotDisplayName(spot: RouteSpot): string {
  return (
    spot.display_name ||
    spot.real_place_name ||
    spot.spot_name ||
    spot.title ||
    spot.place_name
  )
    .trim() || "장소";
}

function effectiveAddressBlock(spot: RouteSpot): string {
  return [spot.address, spot.road_address, spot.address_line].filter(Boolean).join(" ");
}

function effectiveDistrict(spot: RouteSpot): string | null {
  if (spot.district?.trim()) return spot.district.trim();
  const block = effectiveAddressBlock(spot);
  return extractDistrictFromAddress(block);
}

/**
 * 실용 이미지 검색 접미사 — 입구·동선·창가 등 (감성 스톡 최소화)
 */
function practicalVisualSuffix(spot: RouteSpot): string {
  const text = [spot.title, spot.place_name, spot.what_to_do, spot.theme_reason, spot.category]
    .filter(Boolean)
    .join(" ");
  if (/포토|사진|뷰|전망|촬영|인생샷|야경/.test(text)) return "전망 포토";
  if (/카페|커피|베이커리/.test(text)) return "매장 입구 창가";
  if (/광장|궁|문화재|광화문|세종|이순신/.test(text)) return "광장 산책로";
  if (/박물관|전시/.test(text)) return "전시장 로비";
  if (/맛집|식당|음식/.test(text)) return "가게 외관 입구";
  return "입구 외관";
}

export type BuildSpotImageQueryOpts = {
  regionSlug?: string;
  /** 포스트 제목 — 스팟 정보가 빈약할 때 보조 */
  postTitle?: string;
};

/** 실장소명 중심 장면 키워드 (전경·랜드마크 인식률↑). */
function landmarkSceneSuffix(spot: RouteSpot): string {
  const rp = (spot.real_place_name ?? "").trim();
  const name = spotDisplayName(spot);
  const blob = `${rp} ${name} ${spot.title ?? ""} ${spot.place_name ?? ""}`;

  if (/광화문광장|세종대왕|이순신|광화문/.test(blob)) {
    if (/세종|세종대왕/.test(blob)) return "광화문광장 세종대왕 동상";
    if (/이순신/.test(blob)) return "광화문 이순신장군 동상";
    return "광화문광장 전경 세종대로";
  }
  if (/경복궁|광화문 정문|광화문/.test(blob) && /경복|궁/.test(blob)) return "경복궁 광화문 정문";
  if (/블루보틀|Blue\s*Bottle/i.test(blob)) return `${name} 외관`;
  if (/강남역\s*11|11번 출구/.test(blob)) return "강남역 11번 출구";
  if (/테헤란로|역삼역.*강남역/.test(blob)) return "테헤란로 보행로";
  return "";
}

export function buildSpotImageQuery(spot: RouteSpot, opts?: BuildSpotImageQueryOpts | string): string {
  const regionSlug = typeof opts === "string" ? opts : opts?.regionSlug;
  const postTitle = typeof opts === "string" ? undefined : opts?.postTitle;

  if (spot.image_query?.trim()) {
    return spot.image_query.trim();
  }

  const landmark = landmarkSceneSuffix(spot);
  if (landmark) return landmark;

  const name = spot.real_place_name?.trim() || spotDisplayName(spot);
  const district = effectiveDistrict(spot);
  const categoryShort = spot.category?.split(">").pop()?.trim();
  const practical = practicalVisualSuffix(spot);

  // 실장소 + 행정구 + 전경/외관
  if (district) {
    return `${name} ${district} 전경`;
  }

  if (categoryShort) {
    return `${name} ${categoryShort} 외관`;
  }

  const regionLabel =
    regionSlug === "gangnam"
      ? "강남"
      : regionSlug === "gwanghwamun"
        ? "광화문"
        : regionSlug === "hongdae"
          ? "홍대"
          : regionSlug === "itaewon"
            ? "이태원"
            : regionSlug === "myeongdong"
              ? "명동"
              : null;

  if (regionLabel) {
    return `${name} ${regionLabel} ${practical}`;
  }

  if (postTitle?.trim()) {
    return `${postTitle.trim()} ${name}`.slice(0, 120);
  }

  const goal = imageGoalSuffix(spot);
  return `${name} ${practical}`.trim() || `${name} ${goal}`;
}

/**
 * 하루웨이(post) 카드 대표 이미지 검색용 쿼리.
 * 첫 번째 featured 스팟 또는 첫 번째 스팟 기반.
 */
export function buildPostCardImageQuery(
  spots: RouteSpot[],
  postTitle: string,
  regionSlug?: string,
): string {
  const sorted = [...spots].sort((a, b) => a.order - b.order);
  const featured = sorted.find((s) => s.featured) ?? sorted[0];

  if (featured) {
    return buildSpotImageQuery(featured, { regionSlug, postTitle });
  }

  // 포스트 제목 기반 폴백
  return `${postTitle} 장소`;
}
