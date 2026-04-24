import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function LegacyGuardianNewPostRedirect() {
  redirect({ href: "/mypage/guardian/posts/new", locale: await getLocale() });
}
