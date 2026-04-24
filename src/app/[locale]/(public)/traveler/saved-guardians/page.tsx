import { redirect } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function LegacySavedGuardiansRedirect({ params }: Props) {
  const { locale } = await params;
  redirect({ href: "/mypage/saved-guardians", locale });
}
