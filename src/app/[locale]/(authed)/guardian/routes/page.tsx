import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function GuardianRoutesListPage() {
  const locale = await getLocale();
  redirect({ href: "/mypage/guardian/posts", locale });
}
