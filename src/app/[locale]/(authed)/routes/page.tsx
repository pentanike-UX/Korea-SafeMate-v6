import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

/** IA T09 경로 `/routes` — 허브 LNB는 `/mypage/routes` 에서 제공 */
export default async function RoutesAliasRedirectPage() {
  const locale = await getLocale();
  redirect({ href: "/mypage/routes", locale });
}
