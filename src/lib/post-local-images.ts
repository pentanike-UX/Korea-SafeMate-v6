import type { ContentPost, RouteSpot } from "@/types/domain";
import {
  POST_LOCAL_IMAGE_POOL_GANGNAM,
  POST_LOCAL_IMAGE_POOL_GWANGHWAMUN,
} from "@/data/post-local-images-manifest.gen";

/** HTTP(S) assets are ignored for post/spot display — replaced by `/mock/posts/*` mapping. */
export function isExternalPostImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return /^https?:\/\//i.test(url.trim());
}

export type PostVisualBucket = "gangnam" | "gwanghwamun";

export type VisualMood = "cafe" | "landmark" | "street";

export type LocalPostVisualPlan = {
  bucket: PostVisualBucket;
  hero: string;
  /** Article (non-route) optional second still — different from hero when pool allows */
  secondary?: string;
  /** Resolved per spot id (route/hybrid). */
  spotImages: Map<string, string>;
};

function poolForBucket(bucket: PostVisualBucket): readonly string[] {
  return bucket === "gangnam" ? POST_LOCAL_IMAGE_POOL_GANGNAM : POST_LOCAL_IMAGE_POOL_GWANGHWAMUN;
}

export function postHaystack(post: ContentPost): string {
  const parts = [
    post.title,
    post.summary,
    post.body,
    post.tags.join(" "),
    post.region_slug,
    post.category_slug,
    post.kind,
  ];
  if (post.route_journey?.spots.length) {
    for (const s of post.route_journey.spots) {
      parts.push(
        s.title,
        s.place_name,
        s.address_line ?? "",
        s.short_description,
        s.body,
        s.recommend_reason ?? "",
      );
    }
  }
  return parts.join(" ").normalize("NFC");
}

/** 강남_* vs 광화문_* 풀 선택 — 키워드 점수, 동점 시 지역·기본값. */
export function classifyPostVisualBucket(post: ContentPost): PostVisualBucket {
  const h = postHaystack(post);
  const gangnamTerms = [
    "강남",
    "강남역",
    "테헤란로",
    "역삼",
    "신논현",
    "논현",
    "강남권",
    "강남 ",
    "강남·",
    "강남,",
  ];
  const gwTerms = [
    "광화문",
    "경복궁",
    "세종대왕",
    "세종로",
    "세종",
    "이순신",
    "광장",
    "종로",
    "사직로",
    "청와",
    "궁궐",
    "광화문권",
    "경복",
  ];
  let gScore = 0;
  let wScore = 0;
  for (const t of gangnamTerms) {
    if (h.includes(t)) gScore += t.length >= 3 ? 3 : 2;
  }
  for (const t of gwTerms) {
    if (h.includes(t)) wScore += t.length >= 3 ? 3 : 2;
  }
  if (gScore > wScore) return "gangnam";
  if (wScore > gScore) return "gwanghwamun";
  if (post.region_slug === "busan" || h.includes("해운대") || h.includes("부산")) return "gangnam";
  if (post.region_slug === "jeju") return "gangnam";
  return "gwanghwamun";
}

const CAFE_KW = [
  "카페",
  "커피",
  "브런치",
  "디저트",
  "테이크아웃",
  "창가",
  "테라스",
  "실내 좌석",
  "우산 꽂이",
  "녹차",
  "당도",
  "카페인",
];
const LANDMARK_KW = [
  "광장",
  "동상",
  "경복",
  "궁",
  "세종",
  "이순신",
  "랜드마크",
  "광화문",
  "박물관",
  "전망",
  "담장",
  "조형물",
  "한옥",
  "궁궐",
];
const STREET_KW = [
  "도보",
  "산책",
  "거리",
  "동선",
  "횡단",
  "보행",
  "골목",
  "테헤란로",
  "야경",
  "야간",
  "밤",
  "네온",
  "큰 길",
  "출구",
  "만남",
  "환승",
  "지하철",
  "플랫폼",
];

export function scoreVisualMood(text: string): VisualMood {
  const h = text.normalize("NFC");
  let cafe = 0;
  let land = 0;
  let street = 0;
  for (const k of CAFE_KW) if (h.includes(k)) cafe += k.length >= 3 ? 2 : 1;
  for (const k of LANDMARK_KW) if (h.includes(k)) land += k.length >= 3 ? 2 : 1;
  for (const k of STREET_KW) if (h.includes(k)) street += k.length >= 3 ? 2 : 1;
  if (cafe >= land && cafe >= street && cafe > 0) return "cafe";
  if (land >= street && land > 0) return "landmark";
  if (street > 0) return "street";
  return "landmark";
}

function rotateMood(m: VisualMood): VisualMood {
  if (m === "cafe") return "landmark";
  if (m === "landmark") return "street";
  return "cafe";
}

function numericSuffix(url: string): number {
  const m = url.match(/_(\d+)\.[^.]+$/);
  return m ? parseInt(m[1]!, 10) : 0;
}

function moodSlices(pool: readonly string[]): Record<VisualMood, string[]> {
  const sorted = [...pool].sort((a, b) => numericSuffix(a) - numericSuffix(b));
  const n = sorted.length;
  if (n === 0) return { cafe: [], landmark: [], street: [] };
  const a = Math.max(1, Math.floor(n / 3));
  const b = Math.max(a, Math.floor((2 * n) / 3));
  return {
    cafe: sorted.slice(0, a),
    landmark: sorted.slice(a, b),
    street: sorted.slice(b),
  };
}

function hash32(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function spreadPick(seed: string, choices: string[], avoid: Set<string>): string {
  if (choices.length === 0) return "";
  const start = hash32(seed) % choices.length;
  // Prime step gives good full-cycle distribution over most pool sizes.
  const step = 7;
  for (let i = 0; i < choices.length; i++) {
    const idx = (start + i * step) % choices.length;
    const pick = choices[idx]!;
    if (!avoid.has(pick)) return pick;
  }
  return choices[start]!;
}

function pickFromPool(
  pool: readonly string[],
  mood: VisualMood,
  seed: string,
  avoid: Set<string>,
): string {
  if (pool.length === 0) return "";
  const slices = moodSlices(pool);
  const primary = slices[mood];
  if (primary.length > 0) {
    const p = spreadPick(`${seed}|mood`, primary, avoid);
    if (p) return p;
  }
  // Fallback to full regional pool to keep variety high even within same mood-heavy clusters.
  return spreadPick(`${seed}|pool`, [...pool], avoid);
}

/**
 * 단일 진실 소스: 리스트 썸네일·상단 hero·(아티클) 보조 이미지·루트 스팟 썸네일을 한 번에 결정.
 * 외부 URL은 데이터에 있어도 표시용으로 쓰지 않습니다.
 */
export function buildLocalPostVisualPlan(post: ContentPost): LocalPostVisualPlan {
  const bucket = classifyPostVisualBucket(post);
  const pool = poolForBucket(bucket);
  const spotImages = new Map<string, string>();
  const used = new Set<string>();

  if (pool.length === 0) {
    return { bucket, hero: "", spotImages };
  }

  const hay = postHaystack(post);

  if (post.route_journey && post.route_journey.spots.length > 0) {
    const spots = [...post.route_journey.spots].sort((a, b) => a.order - b.order);
    for (let i = 0; i < spots.length; i++) {
      const spot = spots[i]!;
      const own = spot.image_urls.find((u) => u?.trim() && !isExternalPostImageUrl(u));
      if (own) {
        const o = own.trim();
        spotImages.set(spot.id, o);
        used.add(o);
        continue;
      }
      const spotHay = `${spot.title} ${spot.place_name} ${spot.short_description} ${spot.body} ${hay}`;
      const mood = scoreVisualMood(spotHay);
      const url = pickFromPool(pool, mood, `${post.id}|${spot.id}|${i}`, used);
      spotImages.set(spot.id, url);
      used.add(url);
    }
  }

  const heroMood = scoreVisualMood(hay);
  const sortedSpots =
    post.route_journey && post.route_journey.spots.length > 0
      ? [...post.route_journey.spots].sort((a, b) => a.order - b.order)
      : [];
  const firstId = sortedSpots[0]?.id;
  const firstImg = firstId ? spotImages.get(firstId) : undefined;

  const avoidHero = new Set<string>();
  if (firstImg) avoidHero.add(firstImg);
  let hero = pickFromPool(pool, heroMood, `${post.id}|hero`, avoidHero);
  if (!hero) hero = pickFromPool(pool, heroMood, `${post.id}|hero2`, new Set());

  let secondary: string | undefined;
  if (!post.route_journey || post.route_journey.spots.length === 0) {
    secondary = pickFromPool(pool, rotateMood(heroMood), `${post.id}|secondary`, new Set([hero]));
    if (secondary === hero) {
      secondary = pickFromPool(pool, rotateMood(rotateMood(heroMood)), `${post.id}|secondary2`, new Set([hero]));
    }
  }

  return { bucket, hero, secondary, spotImages };
}

export function localHeroAlt(post: ContentPost, plan: LocalPostVisualPlan): string {
  const area = plan.bucket === "gangnam" ? "강남 일대" : "광화문·종로 일대";
  return `${post.title} — ${area}`;
}

export function localSpotAlt(spot: RouteSpot, plan: LocalPostVisualPlan): string {
  const area = plan.bucket === "gangnam" ? "강남" : "광화문";
  return `${spot.place_name} — ${spot.title} (${area})`;
}
