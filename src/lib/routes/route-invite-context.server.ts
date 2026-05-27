import type { AppLocale } from "@/i18n/routing";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { isUuidRouteId } from "@/lib/routes/haru-route-from-supabase.server";

/** 로그인 화면 배너용 — 초대 링크의 루트 제목만 조회. */
export async function fetchRouteTitleForInvite(
  routeId: string,
  locale: AppLocale,
): Promise<string | null> {
  if (!isUuidRouteId(routeId)) return null;
  const svc = createServiceRoleSupabase();
  if (!svc) return null;
  const { data } = await svc
    .from("routes")
    .select("title_ko, title_en, title_th, title_vi, title_ja")
    .eq("id", routeId)
    .maybeSingle();
  if (!data) return null;
  const row = data as {
    title_ko?: string | null;
    title_en?: string | null;
    title_th?: string | null;
    title_vi?: string | null;
    title_ja?: string | null;
  };
  const byLocale: Record<AppLocale, string | null | undefined> = {
    ko: row.title_ko,
    en: row.title_en,
    th: row.title_th,
    vi: row.title_vi,
    ja: row.title_ja,
  };
  return byLocale[locale]?.trim() || row.title_ko?.trim() || row.title_en?.trim() || null;
}
