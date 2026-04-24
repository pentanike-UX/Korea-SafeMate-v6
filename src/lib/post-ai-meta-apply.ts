import type { ContentPost, ContentPostHeroSubject, StructuredExposureMeta } from "@/types/domain";

export function emptyStructuredMeta(): StructuredExposureMeta {
  return {
    audience_tags: [],
    duration_tags: [],
    mobility_tags: [],
    mood_tags: [],
    summary_card: "",
    reason_line: "",
    best_for_context: "",
  };
}

export function mergeStructuredMeta(
  prev: StructuredExposureMeta | undefined,
  patch: Partial<StructuredExposureMeta>,
): StructuredExposureMeta {
  const base = prev ? { ...prev } : emptyStructuredMeta();
  return { ...base, ...patch };
}

export function applyStructuredPatch(
  post: ContentPost,
  patch: Partial<StructuredExposureMeta>,
  heroPatch?: ContentPostHeroSubject | null | undefined,
): ContentPost {
  const j = post.route_journey;
  if (!j) return post;
  const nextStructured = mergeStructuredMeta(j.structured_exposure_meta, patch);
  return {
    ...post,
    ...(heroPatch !== undefined ? { hero_subject: heroPatch } : {}),
    route_journey: {
      ...j,
      structured_exposure_meta: nextStructured,
    },
  };
}

export function buildFullStructuredFromParts(parts: {
  audience_tags: string[];
  duration_tags: string[];
  mobility_tags: string[];
  mood_tags: string[];
  summary_card: string;
  reason_line: string;
  best_for_context: string;
}): StructuredExposureMeta {
  return {
    audience_tags: [...parts.audience_tags],
    duration_tags: [...parts.duration_tags],
    mobility_tags: [...parts.mobility_tags],
    mood_tags: [...parts.mood_tags],
    summary_card: parts.summary_card,
    reason_line: parts.reason_line,
    best_for_context: parts.best_for_context,
  };
}
