import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { GuardianPostsManagement } from "@/components/guardian/guardian-posts-management";
import { getSessionUserId } from "@/lib/supabase/server-user";

export default async function MypageGuardianPostsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>;
}) {
  const locale = await getLocale();
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    redirect({ href: "/login", locale });
  }
  const sp = searchParams ? await searchParams : {};
  return <GuardianPostsManagement sessionUserId={sessionUserId as string} savedBanner={Boolean(sp.saved)} />;
}
