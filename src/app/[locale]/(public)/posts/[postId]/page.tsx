import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PostDetailView } from "@/components/posts/post-detail-view";
import { getPublicPostByIdMerged, listApprovedPostsMerged } from "@/lib/posts-public-merged.server";
import { BRAND } from "@/lib/constants";

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
  const post = await getPublicPostByIdMerged(postId);
  if (!post) notFound();
  return <PostDetailView post={post} />;
}
