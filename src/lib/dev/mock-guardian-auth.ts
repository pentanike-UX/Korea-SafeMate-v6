import type { User } from "@supabase/supabase-js";
import type { AppAccountRole } from "@/lib/auth/app-role";
import type { GuardianProfileStatus } from "@/lib/auth/guardian-profile-status";
import { getGuardianSeedBundle } from "@/data/mock/guardian-seed-bundle";
import type { GuardianLifecycleStatus, GuardianSeedRow } from "@/data/mock/guardian-seed-types";
import { resolveGuardianDisplayName } from "@/data/mock/guardian-seed-display-names";
import { GUARDIAN_SEED_ROWS } from "@/data/mock/guardians-seed";
import { buildDetailMarketingForRow } from "@/data/mock/guardian-marketing-detail-seed";
import { guardianProfileImageUrls, guardianProfileImageUrlsFromIndex } from "@/lib/guardian-profile-images";
import type { GuardianProfile } from "@/types/domain";
import type { GuardianMarketingProfile } from "@/types/guardian-marketing";
import type { LaunchAreaSlug } from "@/types/launch-area";

/** Dev/demo 전용 — 제거 시 이 모듈·API·쿠키 참조를 함께 삭제하면 됩니다. */
export const MOCK_GUARDIAN_COOKIE_NAME = "safemate_mock_guardian_id";

const MOCK_ID_RE = /^mg\d{2}$/;

export function isMockGuardianId(id: string | null | undefined): id is string {
  return !!id && MOCK_ID_RE.test(id);
}

export function getGuardianSeedRow(id: string): GuardianSeedRow | undefined {
  return GUARDIAN_SEED_ROWS.find((r) => r.id === id);
}

export function lifecycleToGuardianProfileStatus(s: GuardianLifecycleStatus): GuardianProfileStatus {
  return s;
}

function launchAreaFromSeedRow(row: GuardianSeedRow): LaunchAreaSlug {
  if (row.primary_region_slug === "busan") return "busan";
  if (row.primary_region_slug === "jeju") return "jeju";
  const n = parseInt(row.id.replace(/\D/g, ""), 10) || 0;
  return n % 2 === 0 ? "gangnam" : "gwanghwamun";
}

export function defaultMarketingFromGuardian(g: GuardianProfile): GuardianMarketingProfile {
  const row = getGuardianSeedRow(g.user_id);
  const bundle = getGuardianSeedBundle();
  let repIds = bundle.posts.filter((p) => p.author_user_id === g.user_id && p.status === "approved").map((p) => p.id).slice(0, 4);
  if (!repIds.length) {
    repIds = bundle.posts.filter((p) => p.author_user_id === g.user_id).map((p) => p.id).slice(0, 4);
  }
  const urls = row ? guardianProfileImageUrlsFromIndex(row.profile_image_index) : guardianProfileImageUrls(g);
  const launch = row ? launchAreaFromSeedRow(row) : "gwanghwamun";
  const stylePool = ["calm", "planner", "energetic", "trendy", "friendly", "flexible"] as const;
  const themePool = ["k_drama_romance", "k_pop_day", "seoul_night", "movie_location", "safe_solo", "photo_route"] as const;
  const n = row ? parseInt(row.id.replace(/\D/g, ""), 10) || 1 : 1;
  const styleA = stylePool[(n - 1) % stylePool.length]!;
  const styleB = stylePool[(n + 1) % stylePool.length]!;
  const themeA = themePool[(n - 1) % themePool.length]!;
  const themeB = themePool[(n + 2) % themePool.length]!;
  const detail = row ? buildDetailMarketingForRow(row) : null;
  const fallbackLong: GuardianMarketingProfile["long_bio"] = {
    ko: [g.bio, `${g.headline} 중심으로 동선과 만남 장소를 짧게 정리해 드립니다.`, "요청 시 일정과 무드를 알려 주시면 맞춤 안내에 도움이 됩니다."].join(
      "\n\n",
    ),
    en: [g.bio, `${g.headline} — practical meetups and moves.`, "Share timing and mood for a tailored reply."].join("\n\n"),
  };
  const base: GuardianMarketingProfile = {
    user_id: g.user_id,
    launch_area_slug: launch,
    // Keep explore filters connected to real option IDs (avoid accidental dead options).
    theme_slugs: [themeA, themeB],
    companion_style_slugs: [styleA, styleB],
    trust_badge_ids: g.guardian_tier === "verified_guardian" ? ["verified", "language_checked", "reviewed"] : ["language_checked", "reviewed"],
    photo_url: urls.default,
    positioning: { ko: g.headline, en: g.headline },
    intro: { ko: g.bio, en: g.bio },
    short_bio: detail?.short_bio ?? { ko: g.headline, en: g.headline },
    long_bio: detail?.long_bio ?? fallbackLong,
    strength_items: detail?.strength_items,
    trust_reason_items: detail?.trust_reason_items,
    signature_style: detail?.signature_style ?? { ko: g.headline, en: g.headline },
    recommended_routes: detail?.recommended_routes ?? [
      {
        title: { ko: `${g.primary_region_slug} 동선`, en: `${g.primary_region_slug} route` },
        blurb: { ko: g.headline, en: g.headline },
      },
    ],
    trip_type_labels: [
      { ko: "하루 동행", en: "Day companion" },
      { ko: "첫날 적응", en: "First-day" },
    ],
    representative_post_ids: repIds.slice(0, 3),
    response_note: detail?.response_note ?? { ko: "시드 데이터 기준", en: "Seed data" },
    review_count_display: Math.min(120, (g.posts_approved_last_30d ?? 0) * 3 + 12),
  };
  return base;
}

export function getMockGuardianProfileForServer(id: string): GuardianProfile | null {
  const g = getGuardianSeedBundle().guardians.find((x) => x.user_id === id);
  return g ?? null;
}

export function getMockGuardianSeedPoints(userId: string | null): number | null {
  if (!isMockGuardianId(userId)) return null;
  const n = getGuardianSeedBundle().pointsByAuthorId[userId!];
  return typeof n === "number" ? n : null;
}

/** 브라우저에서만 사용 (쿠키가 httpOnly가 아닐 때). */
export function readMockGuardianIdFromDocumentCookie(): string | null {
  if (typeof document === "undefined") return null;
  const parts = `; ${document.cookie}`.split(`; ${MOCK_GUARDIAN_COOKIE_NAME}=`);
  if (parts.length < 2) return null;
  const v = parts.pop()?.split(";").shift();
  const id = v ? decodeURIComponent(v) : "";
  return isMockGuardianId(id) ? id : null;
}

export function buildMockSupabaseUser(guardianId: string): User | null {
  const row = getGuardianSeedRow(guardianId);
  if (!row) return null;
  const { avatar } = guardianProfileImageUrlsFromIndex(row.profile_image_index);
  const displayName = resolveGuardianDisplayName(row.id, row.display_name);
  return {
    id: row.id,
    aud: "mock",
    role: "authenticated",
    email: row.email,
    phone: "",
    created_at: new Date().toISOString(),
    app_metadata: { provider: "mock_guardian" },
    user_metadata: { full_name: displayName, name: displayName, avatar_url: avatar, picture: avatar },
    identities: [],
    factors: [],
    is_anonymous: false,
  } as User;
}

export type MockAccountMePayload = {
  auth: { id: string; email: string | undefined; sessionAvatar: string | null; sessionName: string };
  user: {
    id: string;
    email: string;
    app_role: AppAccountRole;
    avatar_url: string | null;
    legal_name: string | null;
    last_login_at: string | null;
    created_at: string;
    auth_provider: string;
  };
  profile: { display_name: string | null; profile_image_url: string | null; intro: string | null };
  app_role: AppAccountRole;
  guardian_status: GuardianProfileStatus;
};

export function buildMockAccountMePayload(guardianId: string): MockAccountMePayload | null {
  const row = getGuardianSeedRow(guardianId);
  const profile = getMockGuardianProfileForServer(guardianId);
  if (!row || !profile) return null;
  const { avatar } = guardianProfileImageUrlsFromIndex(row.profile_image_index);
  const status = lifecycleToGuardianProfileStatus(row.lifecycle_status);
  const displayName = resolveGuardianDisplayName(row.id, row.display_name);
  return {
    auth: {
      id: row.id,
      email: row.email,
      sessionAvatar: avatar,
      sessionName: displayName,
    },
    user: {
      id: row.id,
      email: row.email,
      app_role: "guardian",
      avatar_url: avatar,
      legal_name: displayName,
      last_login_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      auth_provider: "mock_guardian",
    },
    profile: {
      display_name: displayName,
      profile_image_url: avatar,
      intro: row.headline,
    },
    app_role: "guardian",
    guardian_status: status,
  };
}
