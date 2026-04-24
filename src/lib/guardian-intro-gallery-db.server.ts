import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

/**
 * DB에 저장된 소개 갤러리(관리자·가디언 계정 저장).
 * 서비스 롤이 없거나 테이블/행이 없으면 `unavailable` → `mergePublicGuardian`의 파일 폴백 유지.
 */
export async function getIntroGalleryResolutionFromDb(guardianUserId: string): Promise<
  | { kind: "has"; urls: string[] }
  | { kind: "empty" }
  | { kind: "unavailable" }
> {
  const sb = createServiceRoleSupabase();
  if (!sb) return { kind: "unavailable" };

  const { data, error } = await sb
    .from("guardian_profiles")
    .select("intro_gallery_image_urls")
    .eq("user_id", guardianUserId)
    .maybeSingle();

  if (error || data == null) return { kind: "unavailable" };

  const raw = data.intro_gallery_image_urls;
  if (!Array.isArray(raw)) return { kind: "unavailable" };

  const urls = raw.map((u) => String(u).trim()).filter(Boolean);
  if (urls.length === 0) return { kind: "empty" };
  return { kind: "has", urls };
}
