import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getSessionUserId } from "@/lib/supabase/server-user";
import TravelerPointsPage from "@/app/[locale]/(authed)/mypage/points/page";

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return { title: `${t("guardianNavPoints")}` };
}

export default async function MypageGuardianPointsPage() {
  const locale = await getLocale();
  const uid = await getSessionUserId();
  if (!uid) {
    redirect({ href: "/login", locale });
  }
  return <TravelerPointsPage />;
}
