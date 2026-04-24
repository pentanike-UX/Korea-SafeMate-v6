import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { mockContentPosts } from "@/data/mock";
import { GuardianRoutePostEditor } from "@/components/guardian/guardian-route-post-editor";
import { postHasRouteJourney } from "@/lib/content-post-route";
import { getSessionUserId } from "@/lib/supabase/server-user";

type Props = { params: Promise<{ postId: string }> };

export default async function MypageGuardianEditRoutePostPage({ params }: Props) {
  const { postId } = await params;
  const locale = await getLocale();
  const userId = await getSessionUserId();
  if (!userId) {
    redirect({ href: "/login", locale });
  }
  const uid = userId as string;
  const post = mockContentPosts.find((p) => p.id === postId);
  if (!post || post.author_user_id !== uid || !postHasRouteJourney(post)) {
    notFound();
  }
  return <GuardianRoutePostEditor mode="edit" initialPost={post} />;
}
