import type { GuardianProfile } from "@/types/domain";
import type { GuardianMarketingProfile } from "@/types/guardian-marketing";
import type { LaunchAreaSlug } from "@/types/launch-area";
import { defaultMarketingFromGuardian } from "@/lib/dev/mock-guardian-auth";
import { mockGuardianMarketingById } from "@/data/mock/guardian-marketing";
import { mockGuardians } from "@/data/mock/guardians";
import { mockTravelerReviews } from "@/data/mock/traveler-reviews";
import { getIntroGalleriesSeedMap } from "@/lib/guardian-intro-gallery";

export type PublicGuardian = GuardianProfile & GuardianMarketingProfile;

export function getGuardianMarketing(userId: string): GuardianMarketingProfile | null {
  return mockGuardianMarketingById[userId] ?? null;
}

export function mergePublicGuardian(g: GuardianProfile): PublicGuardian {
  const m = getGuardianMarketing(g.user_id);
  const fileIntro = getIntroGalleriesSeedMap()[g.user_id];
  const dbIntro = (g.intro_gallery_image_urls ?? []).map((u) => u.trim()).filter(Boolean);
  const fileList = Array.isArray(fileIntro) ? fileIntro.map((u) => u.trim()).filter(Boolean) : [];
  const introGallery = dbIntro.length > 0 ? dbIntro : fileList;
  const base: PublicGuardian = m
    ? { ...g, ...m, intro_gallery_image_urls: introGallery }
    : { ...g, ...defaultMarketingFromGuardian(g), intro_gallery_image_urls: introGallery };
  const rows = mockTravelerReviews.filter((r) => r.guardian_user_id === g.user_id);
  if (rows.length === 0) return base;
  const sum = rows.reduce((s, r) => s + r.rating, 0);
  const avg = Math.round((sum / rows.length) * 10) / 10;
  return { ...base, review_count_display: rows.length, avg_traveler_rating: avg };
}

export function listPublicGuardians(): PublicGuardian[] {
  return mockGuardians.map((g) => mergePublicGuardian(g));
}

export function getPublicGuardianById(userId: string): PublicGuardian | null {
  const g = mockGuardians.find((x) => x.user_id === userId);
  if (!g) return null;
  return mergePublicGuardian(g);
}


const ACTIVE_LAUNCH: LaunchAreaSlug[] = ["gwanghwamun", "gangnam"];

export function isActiveLaunchArea(slug: LaunchAreaSlug): boolean {
  return ACTIVE_LAUNCH.includes(slug);
}

export function listLaunchReadyGuardians(): PublicGuardian[] {
  return listPublicGuardians().filter((x) => isActiveLaunchArea(x.launch_area_slug));
}
