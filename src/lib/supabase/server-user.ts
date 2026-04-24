import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getMockGuardianIdFromCookies } from "@/lib/dev/mock-guardian-cookies.server";

export async function getServerSupabaseForUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll: ((cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      }) satisfies SetAllCookies,
    },
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const mockId = await getMockGuardianIdFromCookies();
  if (mockId) return mockId;
  const sb = await getServerSupabaseForUser();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

/** 모의 가디언 쿠키를 무시하고 Supabase 세션 사용자만 반환 (여행자 매칭 요청 등). */
export async function getSupabaseAuthUserIdOnly(): Promise<string | null> {
  const sb = await getServerSupabaseForUser();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}
