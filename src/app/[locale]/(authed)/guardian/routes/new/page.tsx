import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function GuardianRouteNewPage() {
  const locale = await getLocale();
  redirect({ href: "/mypage/guardian/posts/new", locale });
}
