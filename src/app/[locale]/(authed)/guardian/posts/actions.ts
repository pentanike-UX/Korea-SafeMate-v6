"use server";

import type { GuardianPostSavePayload } from "@/lib/guardian-posts-api";
import { isUuidString } from "@/lib/guardian-posts-api";
import {
  insertGuardianContentPost,
  updateGuardianContentPost,
  type GuardianPostSaveResult,
} from "@/lib/guardian-posts-persist";
import { getSessionUserId } from "@/lib/supabase/server-user";

export async function saveGuardianRoutePostAction(
  payload: GuardianPostSavePayload,
  existingPostId: string | null,
): Promise<GuardianPostSaveResult> {
  // 세션에서 실제 사용자 ID를 가져와 author_user_id를 덮어씀.
  // 클라이언트가 보낸 author_user_id(seed mock ID 등)는 신뢰하지 않음.
  const sessionUserId = await getSessionUserId();
  if (sessionUserId) {
    payload = { ...payload, author_user_id: sessionUserId };
  }

  if (existingPostId && isUuidString(existingPostId)) {
    return updateGuardianContentPost(existingPostId, payload);
  }
  return insertGuardianContentPost(payload);
}
