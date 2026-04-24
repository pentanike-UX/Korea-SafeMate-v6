import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function LegacyGuardianProfileEditRedirect() {
  redirect({ href: "/mypage/guardian/profile/edit", locale: await getLocale() });
}
