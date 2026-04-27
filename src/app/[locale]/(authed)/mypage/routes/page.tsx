import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function TravelerMyRoutesPage() {
  const locale = await getLocale();
  redirect({ href: "/mypage/journeys", locale });
}
