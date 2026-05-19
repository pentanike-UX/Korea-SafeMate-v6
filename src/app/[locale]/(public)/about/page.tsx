import { getLocale, getTranslations } from "next-intl/server";
import { AboutLanding } from "@/components/about/about-landing";
import { AboutLandingEn } from "@/components/about/about-landing-en";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("AboutPage");
  const locale = await getLocale();
  const ogTitle = locale === "ko" ? `하루란? | ${BRAND.name}` : `What is haru? | ${BRAND.name}`;
  return {
    title: `${t("metaTitle")} | ${BRAND.name}`,
    description: t("metaDescription"),
    openGraph: {
      title: ogTitle,
      description: t("metaDescription"),
    },
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  // ko: 풍부한 한국어 페이지(기존), 그 외: 외국인 시연자용 영어 압축본
  if (locale === "ko") return <AboutLanding />;
  return <AboutLandingEn />;
}
