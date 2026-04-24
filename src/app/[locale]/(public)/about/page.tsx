import { getTranslations } from "next-intl/server";
import { AboutLanding } from "@/components/about/about-landing";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("AboutPage");
  return {
    title: `${t("metaTitle")} | ${BRAND.name}`,
    description: t("metaDescription"),
  };
}

export default function AboutPage() {
  return <AboutLanding />;
}
