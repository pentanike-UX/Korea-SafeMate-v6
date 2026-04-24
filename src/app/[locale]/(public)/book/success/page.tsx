import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { BookingSuccessClient } from "./booking-success-client";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("BookingSuccess");
  const tBook = await getTranslations("Book");
  return {
    title: `${t("title")} | ${BRAND.name}`,
    description: tBook("metaDescription"),
  };
}

export default async function BookSuccessPage() {
  const t = await getTranslations("Book");

  return (
    <Suspense fallback={<p className="text-muted-foreground mx-auto max-w-2xl p-8 text-sm">{t("loading")}</p>}>
      <BookingSuccessClient />
    </Suspense>
  );
}
