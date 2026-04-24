import { redirect } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string; matchId: string }> };

export default async function LegacyMatchDetailRedirect({ params }: Props) {
  const { locale, matchId } = await params;
  redirect({ href: `/mypage/matches/${matchId}`, locale });
}
