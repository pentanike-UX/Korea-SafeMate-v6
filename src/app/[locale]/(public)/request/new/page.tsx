import { getTranslations } from "next-intl/server";
import { CustomRequestForm } from "@/components/traveler/custom-request-form";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("TravelerRequest");
  return {
    title: `${t("formTitle")} — ${BRAND.name}`,
    description: t("formLead"),
  };
}

type Props = {
  searchParams: Promise<{ guardianId?: string | string[] }>;
};

export default async function TravelerRequestNewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const guardianId =
    typeof sp.guardianId === "string" ? sp.guardianId.trim() : undefined;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <CustomRequestForm guardianId={guardianId} />
    </main>
  );
}
