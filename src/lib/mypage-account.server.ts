import type { AppAccountRole } from "@/lib/auth/app-role";
import { getMockGuardianIdFromCookies } from "@/lib/dev/mock-guardian-cookies.server";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

/** 마이페이지 하위 라우트에서 세션·역할을 한 번 더 조회할 때 사용 */
export async function resolveMypageSessionRole(): Promise<{
  appRole: AppAccountRole;
  userId: string | null;
}> {
  const mockId = await getMockGuardianIdFromCookies();
  if (mockId) return { appRole: "guardian", userId: mockId };

  const sb = await getServerSupabaseForUser();
  if (!sb) return { appRole: "traveler", userId: null };

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { appRole: "traveler", userId: null };

  const { data: row } = await sb.from("users").select("app_role").eq("id", user.id).maybeSingle();
  const appRole = (row?.app_role as AppAccountRole | undefined) ?? "traveler";
  return { appRole, userId: user.id };
}
