export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { loginPathForLocale, withLocalePath } from "@/lib/auth/route-path";
import { routing, type AppLocale } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function GuardianSectionLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;
  const locale: AppLocale = routing.locales.includes(localeParam as AppLocale)
    ? (localeParam as AppLocale)
    : routing.defaultLocale;

  const sb = await getServerSupabaseForUser();
  if (!sb) {
    const next = withLocalePath(locale, "/guardian");
    redirect(`${loginPathForLocale(locale)}?next=${encodeURIComponent(next)}`);
  }

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    const next = withLocalePath(locale, "/guardian");
    redirect(`${loginPathForLocale(locale)}?next=${encodeURIComponent(next)}`);
  }

  return <div className="bg-bg-sunken min-h-full">{children}</div>;
}
