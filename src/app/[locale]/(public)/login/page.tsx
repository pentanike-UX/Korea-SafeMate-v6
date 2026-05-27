import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { LoginCardClient } from "@/components/auth/login-card-client";
import { RouteInviteLoginBanner } from "@/components/auth/route-invite-login-banner";
import { MockGuardianQuickLogin } from "@/components/auth/mock-guardian-quick-login";
import { parseInviteFromNextPath } from "@/lib/auth/parse-invite-next-path";
import { fetchRouteTitleForInvite } from "@/lib/routes/route-invite-context.server";
import { MockSuperAdminLogin } from "@/components/auth/mock-super-admin-login";
import { isSuperAdminLoginEnabled } from "@/lib/dev/mock-super-admin-auth";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { withLocalePath } from "@/lib/auth/route-path";
import { BRAND } from "@/lib/constants";
import { routing, type AppLocale } from "@/i18n/routing";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

export async function generateMetadata() {
  const t = await getTranslations("Auth");
  return {
    title: `${t("login.metaTitle")} | ${BRAND.name}`,
  };
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; next?: string | string[] }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale: localeParam } = await params;
  const locale = routing.locales.includes(localeParam as AppLocale) ? (localeParam as AppLocale) : routing.defaultLocale;
  const t = await getTranslations("Auth");
  const sp = await searchParams;
  const nextParam = typeof sp.next === "string" ? sp.next : Array.isArray(sp.next) ? sp.next[0] : undefined;
  const safeNext = safeNextPath(nextParam) ?? withLocalePath(locale, "/explore");
  const inviteFromNext = parseInviteFromNextPath(safeNext);
  const inviteRouteTitle = inviteFromNext
    ? await fetchRouteTitleForInvite(inviteFromNext.routeId, locale)
    : null;

  const sb = await getServerSupabaseForUser();
  if (sb) {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user) {
      redirect(safeNext);
    }
  }

  return (
    <AuthPageFrame
      title={inviteFromNext ? t("routeInviteLoginPageTitle") : t("login.title")}
      description={inviteFromNext ? t("routeInviteLoginPageDescription") : t("login.description")}
    >
      {inviteFromNext ? <RouteInviteLoginBanner routeTitle={inviteRouteTitle} /> : null}
      <LoginCardClient nextPath={safeNext} />
      <MockGuardianQuickLogin
        className="mt-6"
        returnPath={safeNext}
        topSlot={
          isSuperAdminLoginEnabled()
            ? <MockSuperAdminLogin nextPath={safeNext} />
            : null
        }
      />
    </AuthPageFrame>
  );
}
