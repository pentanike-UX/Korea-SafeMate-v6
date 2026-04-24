import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function LegacyGuardianMatchesRedirect() {
  redirect({ href: "/mypage/guardian/matches", locale: await getLocale() });
}
