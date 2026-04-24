import { redirect } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function LegacyMatchesListRedirect({ params }: Props) {
  const { locale } = await params;
  redirect({ href: "/mypage/matches", locale });
}
