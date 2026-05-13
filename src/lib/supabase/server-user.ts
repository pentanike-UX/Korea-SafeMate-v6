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
  // 실제 Supabase 인증 세션이 있으면 mock guardian 쿠키를 무시한다.
  // (OAuth 로그인 후 잔존 mock 쿠키 때문에 user 식별이 "mgXX"로 잘못 잡히는 문제 방지)
  const sb = await getServerSupabaseForUser();
  if (sb) {
    const { data } = await sb.auth.getUser();
    const realUserId = data.user?.id ?? null;
    if (realUserId) return realUserId;
  }
  // 실 세션이 없을 때에만 mock guardian 쿠키를 신뢰한다.
  const mockId = await getMockGuardianIdFromCookies();
  if (mockId) return mockId;
  return null;
}

/** 모의 가디언 쿠키를 무시하고 Supabase 세션 사용자만 반환 (여행자 매칭 요청 등). */
export async function getSupabaseAuthUserIdOnly(): Promise<string | null> {
  const sb = await getServerSupabaseForUser();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}
