import { getTranslations } from "next-intl/server";
import { GuardianProfileEditScreen } from "@/components/guardian/guardian-profile-edit-screen";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("GuardianProfileEdit");
  return {
    title: `${t("metaTitle")} | ${BRAND.name}`,
    description: t("metaDescription"),
  };
}

export default function MypageGuardianProfileEditPage() {
  return <GuardianProfileEditScreen />;
}
