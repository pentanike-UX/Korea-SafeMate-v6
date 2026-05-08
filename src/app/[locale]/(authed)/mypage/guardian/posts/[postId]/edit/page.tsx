import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { mockContentPosts } from "@/data/mock";
import { GuardianRoutePostEditor } from "@/components/guardian/guardian-route-post-editor";
import { postHasRouteJourney } from "@/lib/content-post-route";
import { getSessionUserId } from "@/lib/supabase/server-user";
import { isMockGuardianId, resolveMockGuardianUuid } from "@/lib/dev/mock-guardian-auth";
import { fetchGuardianPreviewPostById } from "@/lib/guardian-posts-read";

type Props = { params: Promise<{ postId: string }> };

export default async function MypageGuardianEditRoutePostPage({ params }: Props) {
  const { postId } = await params;
  const locale = await getLocale();
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    redirect({ href: "/login", locale });
  }
  const uid = sessionUserId as string;

  // mock guardian ID → 실제 UUID 치환 (소유권 비교용)
  const resolvedUid = isMockGuardianId(uid)
    ? (resolveMockGuardianUuid(uid) ?? uid)
    : uid;

  // 1) DB에서 먼저 조회
  const dbPost = await fetchGuardianPreviewPostById(postId);
  if (dbPost) {
    // 소유권: DB의 author_user_id는 실제 UUID
    if (dbPost.author_user_id !== resolvedUid || !postHasRouteJourney(dbPost)) {
      notFound();
    }
    return <GuardianRoutePostEditor mode="edit" initialPost={dbPost} />;
  }

  // 2) DB에 없으면 mock에서 조회 (mock ID · 실제 UUID 둘 다 허용)
  const mockPost = mockContentPosts.find(
    (p) => p.id === postId && (p.author_user_id === uid || p.author_user_id === resolvedUid),
  );
  if (!mockPost || !postHasRouteJourney(mockPost)) {
    notFound();
  }
  return <GuardianRoutePostEditor mode="edit" initialPost={mockPost} />;
}
