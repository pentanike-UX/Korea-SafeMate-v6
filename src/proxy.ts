import createMiddleware from "next-intl/middleware";
import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { AppAccountRole } from "@/lib/auth/app-role";
import {
  guardianPathIsAlwaysAllowed,
  guardianPathRequiresApproved,
  type GuardianProfileStatus,
} from "@/lib/auth/guardian-profile-status";
import { isPrivilegedAppRole } from "@/lib/auth/app-role";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { loginPathWithNext, stripLocaleFromPathname, withLocalePath } from "@/lib/auth/route-path";
import {
  getGuardianSeedRow,
  isMockGuardianId,
  lifecycleToGuardianProfileStatus,
  MOCK_GUARDIAN_COOKIE_NAME,
} from "@/lib/dev/mock-guardian-auth";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

type AccessCtx = {
  user: { id: string } | null;
  appRole: AppAccountRole | null;
  guardianStatus: GuardianProfileStatus;
  onboarded: boolean;
};

function createSupabaseForResponse(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll: ((cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }) satisfies SetAllCookies,
    },
  });
}

async function loadAccessContext(request: NextRequest, response: NextResponse): Promise<AccessCtx> {
  const mockRaw = request.cookies.get(MOCK_GUARDIAN_COOKIE_NAME)?.value;
  if (isMockGuardianId(mockRaw)) {
    const row = getGuardianSeedRow(mockRaw);
    if (row) {
      return {
        user: { id: mockRaw },
        appRole: "guardian",
        guardianStatus: lifecycleToGuardianProfileStatus(row.lifecycle_status),
        onboarded: true,
      };
    }
  }

  const sb = createSupabaseForResponse(request, response);
  if (!sb) return { user: null, appRole: null, guardianStatus: "none", onboarded: false };

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { user: null, appRole: null, guardianStatus: "none", onboarded: false };

  const { data: urow } = await sb.from("users").select("app_role, onboarded").eq("id", user.id).maybeSingle();
  const appRole = (urow?.app_role as AppAccountRole | null) ?? null;
  const onboarded = urow?.onboarded === true;

  const { data: gp } = await sb
    .from("guardian_profiles")
    .select("profile_status, approval_status")
    .eq("user_id", user.id)
    .maybeSingle();

  let guardianStatus: GuardianProfileStatus = "none";
  if (gp) {
    const ps = gp.profile_status as string | null | undefined;
    if (ps === "draft" || ps === "submitted" || ps === "approved" || ps === "rejected" || ps === "suspended") {
      guardianStatus = ps;
    } else {
      const a = gp.approval_status as string | undefined;
      if (a === "approved") guardianStatus = "approved";
      else if (a === "rejected") guardianStatus = "rejected";
      else if (a === "paused") guardianStatus = "suspended";
      else if (a === "under_review") guardianStatus = "submitted";
      else guardianStatus = "submitted";
    }
  }

  return { user, appRole, guardianStatus, onboarded };
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value);
  });
}

function redirectWithSession(request: NextRequest, from: NextResponse, pathAndQuery: string) {
  const target = new URL(pathAndQuery, request.url);
  const red = NextResponse.redirect(target);
  copyCookies(from, red);
  return red;
}

function isConsumerAuthedPath(pathWithoutLocale: string) {
  return (
    pathWithoutLocale === "/mypage" ||
    pathWithoutLocale.startsWith("/mypage/") ||
    pathWithoutLocale === "/matches" ||
    pathWithoutLocale.startsWith("/matches/")
  );
}

/** `/guardians`·`/guardians/*`는 공개 — 가디언 허브만 `/guardian` 접두로 구분 */
function isGuardianContributorPath(pathWithoutLocale: string) {
  if (pathWithoutLocale.startsWith("/guardians")) return false;
  return pathWithoutLocale === "/guardian" || pathWithoutLocale.startsWith("/guardian/");
}

/** 여행자도 신청·온보딩·프로필 편집을 위해 접근 가능한 가디언 영역 (포스팅/매칭 제외). */
function isGuardianOnboardingOrHubPath(pathWithoutLocale: string) {
  if (pathWithoutLocale === "/guardian" || pathWithoutLocale === "/guardian/") return true;
  if (pathWithoutLocale.startsWith("/guardian/onboarding")) return true;
  if (pathWithoutLocale === "/guardian/profile" || pathWithoutLocale.startsWith("/guardian/profile/")) return true;
  if (pathWithoutLocale === "/guardian/dashboard" || pathWithoutLocale.startsWith("/guardian/dashboard/")) return true;
  return false;
}

function isTravelerPrivatePath(pathWithoutLocale: string) {
  const roots = [
    "/traveler/saved-guardians",
    "/traveler/saved-posts",
    "/traveler/points",
    "/traveler/requests",
    "/traveler/messages",
    "/traveler/account",
  ];
  return roots.some((p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`));
}

function needsConsumerAuth(pathWithoutLocale: string) {
  return isConsumerAuthedPath(pathWithoutLocale) || isTravelerPrivatePath(pathWithoutLocale);
}

function isSuperAdminOnlyPath(pathWithoutLocale: string) {
  return (
    pathWithoutLocale.startsWith("/admin/managers") ||
    pathWithoutLocale.startsWith("/admin/settings")
  );
}

/** Next.js 16+: `middleware` convention renamed to `proxy` (same behavior at the edge). */
export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { locale, pathname: pathWo } = stripLocaleFromPathname(pathname);

  // Route handlers live only at `/api/*`. Requests like `/ko/api/...` (relative fetch from localized pages) must rewrite here or they 404.
  if (pathWo.startsWith("/api")) {
    if (pathname !== pathWo) {
      const url = request.nextUrl.clone();
      url.pathname = pathWo;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/auth")) {
    const res = NextResponse.next();
    await loadAccessContext(request, res);
    return res;
  }

  if (pathWo.startsWith("/admin")) {
    const res = NextResponse.next();
    const ctx = await loadAccessContext(request, res);
    // Direct entry to admin shell (no login / mypage hop). Page-level checks handle super-admin-only tools.
    if (isSuperAdminOnlyPath(pathWo) && ctx.user && ctx.appRole !== "super_admin") {
      return redirectWithSession(request, res, "/admin/dashboard");
    }
    return res;
  }

  const intlResponse = intlMiddleware(request);
  const ctx = await loadAccessContext(request, intlResponse);
  const safeNext = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (pathWo === "/login" || pathWo === "/signup") {
    if (ctx.user) {
      return redirectWithSession(request, intlResponse, safeNext ?? withLocalePath(locale, "/explore"));
    }
  }

  if (pathWo === "/onboarding") {
    if (!ctx.user) {
      return redirectWithSession(
        request,
        intlResponse,
        loginPathWithNext(request.nextUrl.pathname, request.nextUrl.search, locale),
      );
    }
    if (ctx.onboarded) {
      return redirectWithSession(request, intlResponse, safeNext ?? withLocalePath(locale, "/explore"));
    }
  }

  if (pathWo.startsWith("/mypage/guardian")) {
    if (!ctx.user) {
      return redirectWithSession(
        request,
        intlResponse,
        loginPathWithNext(request.nextUrl.pathname, request.nextUrl.search, locale),
      );
    }
    if (isPrivilegedAppRole(ctx.appRole ?? undefined)) {
      return redirectWithSession(request, intlResponse, "/admin/dashboard");
    }
    const canUseGuardianAuthoring = ctx.appRole === "guardian" || ctx.guardianStatus === "approved";
    const isMypageGuardianProfilePath =
      pathWo === "/mypage/guardian/profile" || pathWo.startsWith("/mypage/guardian/profile/");
    if (!canUseGuardianAuthoring && !isMypageGuardianProfilePath) {
      return redirectWithSession(request, intlResponse, withLocalePath(locale, "/guardians/apply"));
    }
    if (guardianPathRequiresApproved(pathWo)) {
      if (ctx.guardianStatus !== "approved") {
        const fallback =
          ctx.guardianStatus === "rejected" || ctx.guardianStatus === "suspended"
            ? withLocalePath(locale, "/guardian/profile")
            : withLocalePath(locale, "/guardian");
        return redirectWithSession(request, intlResponse, fallback);
      }
    } else if (!guardianPathIsAlwaysAllowed(pathWo)) {
      if (ctx.guardianStatus !== "approved") {
        return redirectWithSession(request, intlResponse, withLocalePath(locale, "/guardian"));
      }
    }
    return intlResponse;
  }

  if (isGuardianContributorPath(pathWo)) {
    if (!ctx.user) {
      return redirectWithSession(
        request,
        intlResponse,
        loginPathWithNext(request.nextUrl.pathname, request.nextUrl.search, locale),
      );
    }
    if (isPrivilegedAppRole(ctx.appRole ?? undefined)) {
      return redirectWithSession(request, intlResponse, "/admin/dashboard");
    }

    const canUseGuardianAuthoring =
      ctx.appRole === "guardian" || ctx.guardianStatus === "approved";
    if (!canUseGuardianAuthoring) {
      if (!isGuardianOnboardingOrHubPath(pathWo)) {
        return redirectWithSession(request, intlResponse, withLocalePath(locale, "/guardians/apply"));
      }
    }

    if (guardianPathRequiresApproved(pathWo)) {
      if (ctx.guardianStatus !== "approved") {
        const fallback =
          ctx.guardianStatus === "rejected" || ctx.guardianStatus === "suspended"
            ? withLocalePath(locale, "/guardian/profile")
            : withLocalePath(locale, "/guardian");
        return redirectWithSession(request, intlResponse, fallback);
      }
    } else if (!guardianPathIsAlwaysAllowed(pathWo)) {
      if (ctx.guardianStatus !== "approved") {
        return redirectWithSession(request, intlResponse, withLocalePath(locale, "/guardian"));
      }
    }
  }

  if (needsConsumerAuth(pathWo)) {
    if (!ctx.user) {
      return redirectWithSession(
        request,
        intlResponse,
        loginPathWithNext(request.nextUrl.pathname, request.nextUrl.search, locale),
      );
    }
    if (isPrivilegedAppRole(ctx.appRole ?? undefined)) {
      return redirectWithSession(request, intlResponse, "/admin/dashboard");
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
