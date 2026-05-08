"use server";

import type { GuardianPostSavePayload } from "@/lib/guardian-posts-api";
import { isUuidString } from "@/lib/guardian-posts-api";
import {
  insertGuardianContentPost,
  updateGuardianContentPost,
  type GuardianPostSaveResult,
} from "@/lib/guardian-posts-persist";
import { getSessionUserId } from "@/lib/supabase/server-user";
import { moderatePostContent } from "@/lib/content-moderation";

export async function saveGuardianRoutePostAction(
  payload: GuardianPostSavePayload,
  existingPostId: string | null,
): Promise<GuardianPostSaveResult> {
  // 세션에서 실제 사용자 ID를 가져와 author_user_id를 덮어씀.
  const sessionUserId = await getSessionUserId();
  if (sessionUserId) {
    payload = { ...payload, author_user_id: sessionUserId };
  }

  // 게시(approved) 요청일 때만 모더레이션 실행 — draft/pending은 건너뜀.
  if (payload.status === "approved") {
    const mod = moderatePostContent({
      title: payload.title,
      summary: payload.summary,
      body: payload.body,
      tags: payload.tags,
      route_highlights: payload.route_highlights,
    });
    if (mod.blocked) {
      console.warn("[moderation] blocked post:", mod.reasons);
      payload = { ...payload, status: "blocked" };
    }
  }

  if (existingPostId && isUuidString(existingPostId)) {
    return updateGuardianContentPost(existingPostId, payload);
  }
  return insertGuardianContentPost(payload);
}
