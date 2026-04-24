import { cache } from "react";
import { mockContentPosts } from "@/data/mock";
import { postHasRouteJourney } from "@/lib/content-post-route";
import type { ContentPost, ContentPostHeroSubject, ContentPostKind, ContentPostStatus } from "@/types/domain";
import { parsePostStructuredContent } from "@/lib/post-structured-content";
import type { RouteJourney } from "@/types/domain";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

/** `0`/`false` → DB만 사용(시드 반영 후 중복 mock 제거). 미설정 시 기존처럼 mock 보충. */
function mergeSeedMockPostsEnabled(): boolean {
  const v = process.env.SAFE_MERGE_SEED_MOCK;
  return v !== "0" && v !== "false";
}

type RawPost = {
  id: string;
  author_user_id: string;
  region_id: string;
  category_id: string;
  kind: string;
  title: string;
  summary: string | null;
  body: string;
  tags: string[];
  status: string;
  created_at: string;
  usefulness_votes: number;
  helpful_rating: number | null;
  popular_score: number;
  recommended_score: number;
  featured: boolean;
  post_format: string | null;
  cover_image_url: string | null;
  route_journey: RouteJourney | null;
  route_highlights: unknown;
  /** `content_posts.hero_subject` — 마이그레이션 후 Supabase select에 포함 */
  hero_subject?: string | null;
  structured_content?: unknown;
  is_sample?: boolean | null;
  seed_content_key?: string | null;
};

function heroSubjectFromRow(v: unknown): ContentPostHeroSubject | undefined {
  if (v === "person" || v === "place" || v === "mixed") return v;
  return undefined;
}

function mapToContentPost(
  row: RawPost,
  region_slug: string,
  category_slug: string,
  author_display_name: string,
): ContentPost {
  const highlights = Array.isArray(row.route_highlights)
    ? row.route_highlights.filter((x): x is string => typeof x === "string")
    : [];
  const rj = row.route_journey ?? undefined;
  const heroSubject = heroSubjectFromRow(row.hero_subject);
  const structured = parsePostStructuredContent(row.structured_content);
  return {
    id: row.id,
    author_user_id: row.author_user_id,
    author_display_name,
    region_slug,
    category_slug,
    kind: row.kind as ContentPostKind,
    title: row.title,
    body: row.body,
    summary: row.summary ?? "",
    status: row.status as ContentPostStatus,
    created_at: row.created_at,
    tags: row.tags ?? [],
    usefulness_votes: row.usefulness_votes,
    helpful_rating: row.helpful_rating,
    popular_score: row.popular_score,
    recommended_score: row.recommended_score,
    featured: row.featured,
    post_format: row.post_format as ContentPost["post_format"],
    cover_image_url: row.cover_image_url,
    route_journey: rj,
    route_highlights: highlights,
    ...(heroSubject != null ? { hero_subject: heroSubject } : {}),
    ...(structured != null ? { structured_content: structured } : {}),
    ...(row.is_sample === true ? { is_sample: true } : {}),
    has_route: Boolean(rj?.spots?.length),
  };
}

async function mapRowsToPosts(rows: RawPost[]): Promise<ContentPost[]> {
  const sb = createServiceRoleSupabase();
  if (!sb || rows.length === 0) return [];

  const regionIds = [...new Set(rows.map((r) => r.region_id))];
  const categoryIds = [...new Set(rows.map((r) => r.category_id))];
  const authorIds = [...new Set(rows.map((r) => r.author_user_id))];

  const [{ data: regions }, { data: categories }, { data: guardians }] = await Promise.all([
    sb.from("regions").select("id, slug").in("id", regionIds),
    sb.from("content_categories").select("id, slug").in("id", categoryIds),
    sb.from("guardian_profiles").select("user_id, display_name").in("user_id", authorIds),
  ]);

  const regionSlug = new Map((regions ?? []).map((r) => [r.id, r.slug as string]));
  const categorySlug = new Map((categories ?? []).map((c) => [c.id, c.slug as string]));
  const authorName = new Map((guardians ?? []).map((g) => [g.user_id, g.display_name as string]));

  const out: ContentPost[] = [];
  for (const row of rows) {
    const rs = regionSlug.get(row.region_id);
    const cs = categorySlug.get(row.category_id);
    if (!rs || !cs) continue;
    out.push(
      mapToContentPost(row, rs, cs, authorName.get(row.author_user_id)?.trim() || "Guardian"),
    );
  }
  return out;
}

/**
 * 전체 승인 포스트 병합(최대 400행) — 탐색·가디언 목록 등 넓은 목록에 적합.
 * 카드/시트처럼 소수 id만 필요하면 `listApprovedPostsByIdsMerged`·배치 최신글 조회를 우선 검토.
 *
 * 단계적 경량화 후보: `/guardians`, `/posts`, explore, home-recommended(목업), discover-client 등.
 */
export const listApprovedPostsMerged = cache(async (): Promise<ContentPost[]> => {
  const sb = createServiceRoleSupabase();
  const mockApproved = mockContentPosts.filter((p) => p.status === "approved");
  if (!sb) return mockApproved;

  const { data: rows, error } = await sb
    .from("content_posts")
    .select("*")
    .eq("status", "approved")
    .order("recommended_score", { ascending: false })
    .limit(400);

  if (error) {
    console.error("[listApprovedPostsMerged]", error);
    return mockApproved;
  }

  const dbPosts = await mapRowsToPosts((rows ?? []) as RawPost[]);
  const dbIds = new Set(dbPosts.map((p) => p.id));
  const mockOnly =
    mergeSeedMockPostsEnabled() ? mockApproved.filter((m) => !dbIds.has(m.id)) : [];
  return [...dbPosts, ...mockOnly].sort((a, b) => {
    if (b.recommended_score !== a.recommended_score) return b.recommended_score - a.recommended_score;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
});

export async function getPublicPostByIdMerged(id: string): Promise<ContentPost | null> {
  const sb = createServiceRoleSupabase();
  if (sb) {
    const { data: byId, error: errId } = await sb
      .from("content_posts")
      .select("*")
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();
    if (!errId && byId) {
      const mapped = await mapRowsToPosts([byId as RawPost]);
      if (mapped[0]) return mapped[0];
    }
    if (!errId && !byId) {
      const { data: bySeed, error: errSeed } = await sb
        .from("content_posts")
        .select("*")
        .eq("seed_content_key", id)
        .eq("status", "approved")
        .maybeSingle();
      if (!errSeed && bySeed) {
        const mapped = await mapRowsToPosts([bySeed as RawPost]);
        if (mapped[0]) return mapped[0];
      }
    }
  }
  const mock = mockContentPosts.find((x) => x.id === id);
  if (mock && mock.status === "approved") return mock;
  return null;
}

const mockApprovedById = (): Map<string, ContentPost> => {
  const m = new Map<string, ContentPost>();
  for (const p of mockContentPosts) {
    if (p.status === "approved") m.set(p.id, p);
  }
  return m;
};

/**
 * 대표 포스트 id들만 승인본으로 조회 — 전체 `listApprovedPostsMerged` 대신 카드/시트용.
 * id 순서는 첫 인자 배열의 고유 순서를 따른다.
 */
export async function listApprovedPostsByIdsMerged(ids: string[]): Promise<ContentPost[]> {
  const unique = [...new Set(ids.map((x) => x.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const mockMap = mockApprovedById();
  const sb = createServiceRoleSupabase();

  if (!sb) {
    return unique.map((id) => mockMap.get(id)).filter((p): p is ContentPost => Boolean(p));
  }

  const { data: rows, error } = await sb
    .from("content_posts")
    .select("*")
    .in("id", unique)
    .eq("status", "approved");

  if (error) {
    console.error("[listApprovedPostsByIdsMerged]", error);
    return unique.map((id) => mockMap.get(id)).filter((p): p is ContentPost => Boolean(p));
  }

  const dbPosts = await mapRowsToPosts((rows ?? []) as RawPost[]);
  const dbById = new Map(dbPosts.map((p) => [p.id, p]));

  const out: ContentPost[] = [];
  for (const id of unique) {
    const fromDb = dbById.get(id);
    if (fromDb) {
      out.push(fromDb);
      continue;
    }
    const fromMock = mergeSeedMockPostsEnabled() ? mockMap.get(id) : undefined;
    if (fromMock) out.push(fromMock);
  }
  return out;
}

/** 대표 id가 비었거나 승인 목록에 없을 때 — 해당 가디언의 최신 승인 포스트 1건 */
export async function getLatestApprovedPostForGuardianMerged(authorUserId: string): Promise<ContentPost | null> {
  if (!authorUserId.trim()) return null;
  const mockApproved = mockContentPosts.filter((p) => p.status === "approved" && p.author_user_id === authorUserId);
  const bestMock = mockApproved.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];

  const sb = createServiceRoleSupabase();
  if (!sb) return bestMock ?? null;

  const { data: row, error } = await sb
    .from("content_posts")
    .select("*")
    .eq("author_user_id", authorUserId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getLatestApprovedPostForGuardianMerged]", error);
    return mergeSeedMockPostsEnabled() ? (bestMock ?? null) : null;
  }

  if (row) {
    const mapped = await mapRowsToPosts([row as RawPost]);
    if (mapped[0]) return mapped[0];
  }
  return mergeSeedMockPostsEnabled() ? (bestMock ?? null) : null;
}

function upsertLatestByAuthor(m: Map<string, ContentPost>, p: ContentPost) {
  const cur = m.get(p.author_user_id);
  if (!cur || new Date(p.created_at).getTime() > new Date(cur.created_at).getTime()) {
    m.set(p.author_user_id, p);
  }
}

/**
 * 폴백용 — 가디언별 최신 승인 글 1건을 한 번의(또는 소수의) 조회에 가깝게 채운다.
 * DB는 `created_at` 내림차순 상한 행만 가져온 뒤 작성자당 첫 행을 채택하므로,
 * 한도에 걸려 누락된 작성자는 `getLatestApprovedPostForGuardianMerged`로 보충한다.
 */
export async function getLatestApprovedPostsForGuardiansMergedBatch(
  authorUserIds: string[],
): Promise<Map<string, ContentPost>> {
  const unique = [...new Set(authorUserIds.map((x) => x.trim()).filter(Boolean))];
  const out = new Map<string, ContentPost>();
  if (unique.length === 0) return out;

  const uidSet = new Set(unique);
  const sb = createServiceRoleSupabase();

  if (sb) {
    const maxRows = Math.min(500, Math.max(unique.length * 25, unique.length));
    const { data: rows, error } = await sb
      .from("content_posts")
      .select("*")
      .in("author_user_id", unique)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(maxRows);

    if (error) {
      console.error("[getLatestApprovedPostsForGuardiansMergedBatch]", error);
    } else if (rows?.length) {
      const mapped = await mapRowsToPosts(rows as RawPost[]);
      for (const p of mapped) {
        if (!out.has(p.author_user_id)) out.set(p.author_user_id, p);
      }
    }
  }

  if (mergeSeedMockPostsEnabled()) {
    const mockLatestByAuthor = new Map<string, ContentPost>();
    for (const p of mockContentPosts) {
      if (p.status !== "approved" || !uidSet.has(p.author_user_id)) continue;
      upsertLatestByAuthor(mockLatestByAuthor, p);
    }
    for (const [aid, p] of mockLatestByAuthor) {
      if (!out.has(aid)) out.set(aid, p);
    }
  }

  const missing = unique.filter((id) => !out.has(id));
  if (missing.length > 0) {
    const singles = await Promise.all(missing.map((id) => getLatestApprovedPostForGuardianMerged(id)));
    missing.forEach((id, i) => {
      const p = singles[i];
      if (p) out.set(id, p);
    });
  }

  return out;
}

export async function listApprovedRoutePostsMerged(): Promise<ContentPost[]> {
  const all = await listApprovedPostsMerged();
  return all.filter((p) => postHasRouteJourney(p));
}

export async function listPostsForGuardianMerged(authorUserId: string): Promise<ContentPost[]> {
  const all = await listApprovedPostsMerged();
  return all.filter((p) => p.author_user_id === authorUserId);
}

/**
 * 상세 하단·시트용 관련 포스트. `min` 미만이면 지역/카테고리 필터 밖에서도 채워 최소 노출을 맞춘다.
 */
export async function relatedPostsForMerged(
  current: ContentPost,
  opts: { max?: number; min?: number } = {},
): Promise<ContentPost[]> {
  const max = opts.max ?? 8;
  const min = Math.min(opts.min ?? 3, max);

  const all = await listApprovedPostsMerged();
  const others = all.filter((p) => p.id !== current.id);

  const scored = others
    .map((p) => {
      let bonus = 0;
      if (p.region_slug === current.region_slug) bonus += 100;
      if (p.category_slug === current.category_slug) bonus += 80;
      if (p.author_user_id === current.author_user_id) bonus += 70;
      if (p.kind === current.kind) bonus += 25;
      const tagOverlap = p.tags.filter((tg) => current.tags.includes(tg)).length;
      bonus += tagOverlap * 12;
      return { p, score: p.recommended_score + bonus };
    })
    .sort((a, b) => b.score - a.score);

  const picked: ContentPost[] = [];
  const seen = new Set<string>();

  for (const { p } of scored) {
    if (picked.length >= max) break;
    if (p.region_slug === current.region_slug || p.category_slug === current.category_slug) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        picked.push(p);
      }
    }
  }

  if (picked.length < min) {
    for (const { p } of scored) {
      if (picked.length >= max) break;
      if (!seen.has(p.id)) {
        seen.add(p.id);
        picked.push(p);
      }
    }
  }

  return picked.slice(0, max);
}
