import { redirect } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
};

/** 가디언 전용 로그인은 제거 — 통합 로그인으로 안내합니다. */
export default async function GuardianLoginRedirect({ params, searchParams }: Props) {
  const { locale: localeParam } = await params;
  const locale = routing.locales.includes(localeParam as AppLocale) ? (localeParam as AppLocale) : routing.defaultLocale;
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : Array.isArray(sp.next) ? sp.next[0] : undefined;
  const err = typeof sp.error === "string" ? sp.error : Array.isArray(sp.error) ? sp.error[0] : undefined;
  const qs = new URLSearchParams();
  if (err) qs.set("error", err);
  if (next) qs.set("next", next);
  const q = qs.toString();
  redirect({ href: q ? `/login?${q}` : "/login", locale });
}
