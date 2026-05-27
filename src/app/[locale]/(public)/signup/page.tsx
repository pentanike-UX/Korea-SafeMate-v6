import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { RouteInviteLoginBanner } from "@/components/auth/route-invite-login-banner";
import { SignupCardClient } from "@/components/auth/signup-card-client";
import { parseInviteFromNextPath } from "@/lib/auth/parse-invite-next-path";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { fetchRouteTitleForInvite } from "@/lib/routes/route-invite-context.server";
import { withLocalePath } from "@/lib/auth/route-path";
import { BRAND } from "@/lib/constants";
import { routing, type AppLocale } from "@/i18n/routing";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

export async function generateMetadata() {
  const t = await getTranslations("Auth");
  return {
    title: `${t("signup.metaTitle")} | ${BRAND.name}`,
  };
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SignupPage({ params, searchParams }: Props) {
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
      title={inviteFromNext ? t("routeInviteLoginPageTitle") : t("signup.title")}
      description={inviteFromNext ? t("routeInviteLoginPageDescription") : t("signup.description")}
    >
      {inviteFromNext ? <RouteInviteLoginBanner routeTitle={inviteRouteTitle} /> : null}
      <SignupCardClient nextPath={safeNext} />
    </AuthPageFrame>
  );
}
