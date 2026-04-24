import type { ContentPost } from "@/types/domain";
import { classifyPostVisualBucket } from "@/lib/post-local-images";
import { demoPickLocal, hashStringToInt } from "@/lib/post-demo-local-images";
import { normalizeNonSamplePostBody } from "@/lib/post-seed-content-templates";
import { getGuardianSeedBundle } from "./guardian-seed-bundle";
import { applyServiceSampleOverlay } from "./service-sample-overlay";

function normalizeSeedPostDisplay(p: ContentPost): ContentPost {
  if (p.is_sample) return p;
  let q = normalizeNonSamplePostBody(p);
  if (!q.cover_image_url?.trim()) {
    q = { ...q, cover_image_url: demoPickLocal(classifyPostVisualBucket(q), hashStringToInt(q.id)) };
  }
  return q;
}

/** 포스트 목록 — 시드 → 샘플 오버레이 → 비샘플 실용 팁 템플릿·로컬 커버 */
export const mockContentPosts: ContentPost[] = applyServiceSampleOverlay(getGuardianSeedBundle().posts).map(
  normalizeSeedPostDisplay,
);
