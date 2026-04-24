"use client";

import type { ContentPost } from "@/types/domain";
import { PostPreviewSheetButton } from "@/components/posts/post-preview-sheet";

/** Mypage: post preview in sheet; full detail only via in-sheet action. */
export function MypagePostPreviewSheetTrigger({
  post,
  triggerLabel,
  triggerVariant = "outline",
}: {
  post: ContentPost;
  triggerLabel: string;
  triggerVariant?: "outline" | "ghost" | "default";
}) {
  return (
    <PostPreviewSheetButton post={post} triggerLabel={triggerLabel} triggerVariant={triggerVariant} size="sm" />
  );
}
