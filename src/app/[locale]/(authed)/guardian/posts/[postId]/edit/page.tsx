import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

type Props = { params: Promise<{ postId: string }> };

export default async function LegacyGuardianEditPostRedirect({ params }: Props) {
  const { postId } = await params;
  redirect({ href: `/mypage/guardian/posts/${postId}/edit`, locale: await getLocale() });
}
