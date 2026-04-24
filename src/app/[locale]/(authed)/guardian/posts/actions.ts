"use server";

import type { GuardianPostSavePayload } from "@/lib/guardian-posts-api";
import { isUuidString } from "@/lib/guardian-posts-api";
import {
  insertGuardianContentPost,
  updateGuardianContentPost,
  type GuardianPostSaveResult,
} from "@/lib/guardian-posts-persist";

export async function saveGuardianRoutePostAction(
  payload: GuardianPostSavePayload,
  existingPostId: string | null,
): Promise<GuardianPostSaveResult> {
  if (existingPostId && isUuidString(existingPostId)) {
    return updateGuardianContentPost(existingPostId, payload);
  }
  return insertGuardianContentPost(payload);
}
