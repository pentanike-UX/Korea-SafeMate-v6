import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function GuardianEarningsPage() {
  const locale = await getLocale();
  redirect({ href: "/guardian/dashboard", locale });
}
