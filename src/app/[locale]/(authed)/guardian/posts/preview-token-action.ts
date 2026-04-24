"use server";

import { isUuidString } from "@/lib/guardian-posts-api";
import { signPostPreviewToken } from "@/lib/post-preview-token";

export async function signGuardianPostPreviewTokenAction(
  postId: string,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  if (!isUuidString(postId)) {
    return { ok: false, error: "Invalid post id" };
  }
  try {
    const token = signPostPreviewToken(postId, 3600);
    return { ok: true, token };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not sign token" };
  }
}
