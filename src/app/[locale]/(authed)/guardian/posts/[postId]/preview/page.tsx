import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

type Props = {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function LegacyGuardianPostPreviewRedirect({ params, searchParams }: Props) {
  const { postId } = await params;
  const { t } = await searchParams;
  const q = t ? `?t=${encodeURIComponent(t)}` : "";
  redirect({ href: `/mypage/guardian/posts/${postId}/preview${q}`, locale: await getLocale() });
}
