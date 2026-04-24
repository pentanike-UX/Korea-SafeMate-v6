import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("Book");
  return {
    title: `${t("metaTitle")} | ${BRAND.name}`,
    description: t("metaDescription"),
  };
}

export default async function BookPage() {
  const t = await getTranslations("Book");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 max-w-2xl">
        <p className="text-primary text-xs font-semibold tracking-widest uppercase">{t("eyebrow")}</p>
        <h1 className="text-foreground mt-2 text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">{t("intro")}</p>
      </header>
      <Suspense fallback={<p className="text-muted-foreground text-sm">{t("loading")}</p>}>
        <BookingWizard />
      </Suspense>
    </div>
  );
}
