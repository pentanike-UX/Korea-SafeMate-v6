import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { syncEmailUserFromSession } from "@/lib/auth/sync-email-user";
import { syncOAuthUserFromSession } from "@/lib/auth/sync-oauth-user";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { resolveOAuthRedirectBase } from "@/lib/site-url";

/**
 * Supabase OAuth (Google 등) PKCE 콜백.
 * Supabase 대시보드 → Authentication → URL configuration:
 * - Site URL: 프로덕션 canonical (예: https://korea-safe-mate-v6.vercel.app)
 * - Redirect URLs: 위 origin의 `/auth/callback`, 로컬, 필요 시 `https://*.vercel.app/auth/callback` (와일드카드는 허용만)
 * - `next` 쿼리로 `/ko/mypage` 등 로케일 경로 전달; origin은 `src/lib/site-url.ts`에서 프로덕션 고정
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // `next`는 우선 query에서 (legacy), 없으면 `ksm_oauth_next` 쿠키에서 읽는다.
  // 쿠키 방식은 redirectTo의 쿼리스트링 제거를 통해 Supabase allowlist 매칭 안정성을 확보한다.
  const cookieStoreEarly = await cookies();
  const nextRawFromQuery = searchParams.get("next");
  const nextRawFromCookie = cookieStoreEarly.get("ksm_oauth_next")?.value
    ? decodeURIComponent(cookieStoreEarly.get("ksm_oauth_next")!.value)
    : null;
  const next = safeNextPath(nextRawFromQuery ?? nextRawFromCookie) ?? "/";
  const base = resolveOAuthRedirectBase(request);

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!sbUrl || !sbKey) {
    return NextResponse.redirect(`${base}/login?error=config`);
  }

  if (!code) {
    return NextResponse.redirect(`${base}/login?error=oauth`);
  }

  const cookieStore = cookieStoreEarly;
  const redirectResponse = NextResponse.redirect(`${base}${next}`);
  // OAuth 완료 후 임시 next 쿠키는 즉시 제거
  redirectResponse.cookies.set("ksm_oauth_next", "", { path: "/", maxAge: 0 });

  const supabase = createServerClient(sbUrl, sbKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll: ((cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options);
        });
      }) satisfies SetAllCookies,
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${base}/login?error=oauth`);
  }

  const { data: userData } = await supabase.auth.getUser();
  const svc = createServiceRoleSupabase();
  if (userData.user && svc) {
    const providers = new Set((userData.user.identities ?? []).map((identity) => identity.provider));
    if (providers.has("google")) {
      await syncOAuthUserFromSession(userData.user, svc);
    } else {
      await syncEmailUserFromSession(userData.user, svc);
    }
  }

  return redirectResponse;
}
