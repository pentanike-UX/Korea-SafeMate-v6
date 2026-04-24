/**
 * 대표 포스트 해석: `representative_post_ids` 순으로 `postCatalog`에서만 찾는다.
 * - 카탈로그가 전체 승인 목록이면 DB에 없는 id는 스킵 → rep 맥락 null 가능.
 * - `listApprovedPostsByIdsMerged` + `getLatestApprovedPostsForGuardiansMergedBatch`(폴백 N+1 완화)와
 *   `*WithFallback` 헬퍼로 null 빈도를 줄인다.
 */
import type { ContentPost } from "@/types/domain";
import type { PublicGuardian } from "@/lib/guardian-public";
import { postContextFromContentPost } from "@/lib/guardian-request-post-context";

type RepIdSource = Pick<PublicGuardian, "representative_post_ids">;

/** 카드 묶음에서 대표 포스트 id만 모을 때 */
export function collectRepresentativePostIds(guardians: RepIdSource[]): string[] {
  return [...new Set(guardians.flatMap((g) => g.representative_post_ids ?? []).map((id) => id.trim()).filter(Boolean))];
}

/**
 * `representative_post_ids` 순서대로 카탈로그에서 풀 `ContentPost`를 해석한다.
 * 카탈로그에 없는 id는 건너뛴다(mock/DB 불일치 시 repCtx null에 가깝게).
 */
export function resolveRepresentativeContentPosts(
  guardian: RepIdSource,
  postCatalog: ContentPost[],
  limit = 3,
): ContentPost[] {
  const ids = guardian.representative_post_ids ?? [];
  const out: ContentPost[] = [];
  for (const id of ids) {
    if (!id || out.length >= limit) break;
    const p = postCatalog.find((x) => x.id === id);
    if (p) out.push(p);
  }
  return out;
}

export function resolveRepresentativeContentPost(
  guardian: RepIdSource,
  postCatalog: ContentPost[],
): ContentPost | null {
  return resolveRepresentativeContentPosts(guardian, postCatalog, 1)[0] ?? null;
}

/** 프리뷰 시트 `representativePosts` 슬롯용 — id 순서 유지 */
export function representativePostLinesForSheetPreview(
  guardian: RepIdSource,
  postCatalog: ContentPost[],
  limit = 3,
): Pick<ContentPost, "id" | "title" | "summary">[] {
  return resolveRepresentativeContentPosts(guardian, postCatalog, limit).map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.summary,
  }));
}

/** 대표 포스트 1건이 카탈로그에 있을 때만 요청 시트 맥락 생성 */
export function postContextFromGuardianRepresentative(
  guardian: RepIdSource,
  postCatalog: ContentPost[],
): ReturnType<typeof postContextFromContentPost> | null {
  const p = resolveRepresentativeContentPost(guardian, postCatalog);
  return p ? postContextFromContentPost(p) : null;
}

/**
 * 대표 id가 승인 카탈로그에 없을 때 가디언 최신 승인 포스트로 요청 시트 맥락을 채운다.
 * `fallbackPost`는 호출측에서 `getLatestApprovedPostsForGuardiansMergedBatch` 등으로 준비.
 */
export function postContextFromGuardianRepresentativeWithFallback(
  guardian: RepIdSource,
  repCatalog: ContentPost[],
  fallbackPost: ContentPost | null,
): ReturnType<typeof postContextFromContentPost> | null {
  const primary = postContextFromGuardianRepresentative(guardian, repCatalog);
  if (primary) return primary;
  return fallbackPost ? postContextFromContentPost(fallbackPost) : null;
}

/** 프리뷰 줄이 비면 폴백 포스트 1건으로 시트 대표 목록을 채운다 */
export function representativePostLinesForSheetPreviewWithFallback(
  guardian: RepIdSource,
  repCatalog: ContentPost[],
  fallbackPost: ContentPost | null,
  limit = 3,
): Pick<ContentPost, "id" | "title" | "summary">[] {
  const lines = representativePostLinesForSheetPreview(guardian, repCatalog, limit);
  if (lines.length > 0) return lines;
  if (!fallbackPost) return [];
  return [{ id: fallbackPost.id, title: fallbackPost.title, summary: fallbackPost.summary }];
}
