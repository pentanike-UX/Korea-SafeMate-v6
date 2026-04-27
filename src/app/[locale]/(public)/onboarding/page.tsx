import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { OnboardingCardClient } from "@/components/auth/onboarding-card-client";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { loginPathForLocale, withLocalePath } from "@/lib/auth/route-path";
import { BRAND } from "@/lib/constants";
import { routing, type AppLocale } from "@/i18n/routing";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

export async function generateMetadata() {
  const t = await getTranslations("Auth");
  return {
    title: `${t("onboarding.metaTitle")} | ${BRAND.name}`,
  };
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function OnboardingPage({ params, searchParams }: Props) {
  const { locale: localeParam } = await params;
  const locale = routing.locales.includes(localeParam as AppLocale) ? (localeParam as AppLocale) : routing.defaultLocale;
  const t = await getTranslations("Auth");
  const sp = await searchParams;
  const nextParam = typeof sp.next === "string" ? sp.next : Array.isArray(sp.next) ? sp.next[0] : undefined;
  const safeNext = safeNextPath(nextParam) ?? withLocalePath(locale, "/explore");

  const sb = await getServerSupabaseForUser();
  if (!sb) {
    redirect(`${loginPathForLocale(locale)}?next=${encodeURIComponent(withLocalePath(locale, "/onboarding"))}`);
  }

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    redirect(`${loginPathForLocale(locale)}?next=${encodeURIComponent(withLocalePath(locale, "/onboarding"))}`);
  }

  const { data: userRow } = await sb.from("users").select("onboarded").eq("id", user.id).maybeSingle();
  if (userRow?.onboarded) {
    redirect(safeNext);
  }

  return (
    <AuthPageFrame title={t("onboarding.title")} description={t("onboarding.description")}>
      <OnboardingCardClient nextPath={safeNext} />
    </AuthPageFrame>
  );
}
