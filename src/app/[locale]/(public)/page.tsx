import { getTranslations } from "next-intl/server";
import { LandingPage } from "@/components/marketing/landing-page";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("Landing");
  return {
    title: `${BRAND.name} — ${t("hero_subline")}`,
    description: t("hero_subline"),
  };
}

export default function HomePage() {
  return <LandingPage />;
}
