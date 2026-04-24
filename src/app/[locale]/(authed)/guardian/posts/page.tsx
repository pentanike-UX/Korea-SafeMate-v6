import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function LegacyGuardianPostsRedirect() {
  redirect({ href: "/mypage/guardian/posts", locale: await getLocale() });
}
