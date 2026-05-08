import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PostDetailView } from "@/components/posts/post-detail-view";
import { getPublicPostByIdMerged, listApprovedPostsMerged } from "@/lib/posts-public-merged.server";
import { getSessionUserId } from "@/lib/supabase/server-user";
import { isMockGuardianId, resolveMockGuardianUuid } from "@/lib/dev/mock-guardian-auth";
import { BRAND } from "@/lib/constants";

// 세션 쿠키를 읽기 때문에 동적 렌더링 (소유자 판단 → 수정 버튼 노출)
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; postId: string }> };

export async function generateStaticParams() {
  const posts = await listApprovedPostsMerged();
  return posts.map((p) => ({ postId: p.id }));
}

export async function generateMetadata({ params }: Props) {
  const { postId } = await params;
  const post = await getPublicPostByIdMerged(postId);
  const t = await getTranslations("Posts");
  if (!post) {
    return { title: `${t("notFound")} | ${BRAND.name}` };
  }
  return {
    title: `${post.title} | ${BRAND.name}`,
    description: post.summary,
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { postId } = await params;
  const [post, sessionUserId] = await Promise.all([getPublicPostByIdMerged(postId), getSessionUserId()]);
  if (!post) notFound();
  // mock guardian ID(mg01~mg15)는 실제 UUID로 치환해 소유권 비교
  const resolvedUserId = sessionUserId && isMockGuardianId(sessionUserId)
    ? (resolveMockGuardianUuid(sessionUserId) ?? sessionUserId)
    : sessionUserId;
  const isOwner = Boolean(resolvedUserId && post.author_user_id === resolvedUserId);
  const editHref = isOwner ? `/mypage/guardian/posts/${postId}/edit` : undefined;
  return <PostDetailView post={post} editHref={editHref} isOwner={isOwner} />;
}
