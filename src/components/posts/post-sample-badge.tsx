"use client";

import { cn } from "@/lib/utils";
import {
  POST_SAMPLE_BADGE_CLASS,
  POST_SAMPLE_BADGE_ON_IMAGE_CLASS,
} from "@/components/posts/post-sample-constants";

const SAMPLE_BADGE_TITLE = "Example post for service demo";

export function PostSampleBadge({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "onImage";
}) {
  const base = variant === "onImage" ? POST_SAMPLE_BADGE_ON_IMAGE_CLASS : POST_SAMPLE_BADGE_CLASS;
  return (
    <span className={cn(base, className)} title={SAMPLE_BADGE_TITLE}>
      sample
    </span>
  );
}
