import type {
  ContentPost,
  ContentPostHeroSubject,
  ContentPostKind,
  ContentPostStatus,
  PostStructuredContentV1,
  RouteJourney,
} from "@/types/domain";
import { parsePostStructuredContent } from "@/lib/post-structured-content";

/** Payload accepted by POST/PATCH `/api/guardian/posts` — mirrors `ContentPost` write shape. */
export type GuardianPostSavePayload = {
  author_user_id: string;
  region_slug: string;
  category_slug: string;
  kind: ContentPostKind;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  status: ContentPostStatus;
  post_format?: ContentPost["post_format"];
  cover_image_url?: string | null;
  /** DB 컬럼 추가 전까지는 페이로드만 수용(클라이언트·미리보기용). persist는 무시 가능. */
  hero_subject?: ContentPostHeroSubject | null;
  route_journey: RouteJourney;
  route_highlights?: string[];
  structured_content?: PostStructuredContentV1 | null;
};

function parseOptionalHeroSubject(v: unknown): ContentPostHeroSubject | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (v === "person" || v === "place" || v === "mixed") return v;
  return undefined;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidString(id: string): boolean {
  return UUID_RE.test(id);
}

/**
 * Map mock author keys (e.g. `g1`) to Supabase `users.id`.
 * Set `GUARDIAN_AUTHOR_USER_MAP` JSON, e.g. `{"g1":"550e8400-e29b-41d4-a716-446655440000"}`.
 */
export function resolveAuthorUserId(raw: string): string | null {
  const trimmed = raw.trim();
  if (isUuidString(trimmed)) return trimmed;
  const mapJson = process.env.GUARDIAN_AUTHOR_USER_MAP;
  if (mapJson) {
    try {
      const map = JSON.parse(mapJson) as Record<string, string>;
      const v = map[trimmed];
      if (v && isUuidString(v)) return v;
    } catch {
      /* ignore */
    }
  }
  const fallback = process.env.DEFAULT_GUARDIAN_AUTHOR_USER_ID;
  if (fallback && isUuidString(fallback)) return fallback;
  return null;
}

export function verifyGuardianPostsSecret(req: Request): boolean {
  const secret = process.env.GUARDIAN_POSTS_API_SECRET;
  if (!secret) return true;
  return req.headers.get("x-guardian-posts-secret") === secret;
}

export function parseGuardianPostPayload(body: unknown): GuardianPostSavePayload | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (
    typeof o.author_user_id !== "string" ||
    typeof o.region_slug !== "string" ||
    typeof o.category_slug !== "string" ||
    typeof o.kind !== "string" ||
    typeof o.route_journey !== "object" ||
    o.route_journey === null
  ) {
    return null;
  }
  return {
    author_user_id: o.author_user_id,
    region_slug: o.region_slug,
    category_slug: o.category_slug,
    kind: o.kind as GuardianPostSavePayload["kind"],
    title: typeof o.title === "string" ? o.title : "",
    summary: typeof o.summary === "string" ? o.summary : "",
    body: typeof o.body === "string" ? o.body : "",
    tags: Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === "string") : [],
    status: (typeof o.status === "string" ? o.status : "draft") as GuardianPostSavePayload["status"],
    post_format: o.post_format as GuardianPostSavePayload["post_format"],
    cover_image_url:
      typeof o.cover_image_url === "string" || o.cover_image_url === null
        ? (o.cover_image_url as string | null)
        : undefined,
    route_journey: o.route_journey as GuardianPostSavePayload["route_journey"],
    route_highlights: Array.isArray(o.route_highlights)
      ? o.route_highlights.filter((x): x is string => typeof x === "string")
      : undefined,
    hero_subject: parseOptionalHeroSubject(o.hero_subject),
    structured_content:
      o.structured_content === null
        ? null
        : parsePostStructuredContent(o.structured_content) ?? undefined,
  };
}
