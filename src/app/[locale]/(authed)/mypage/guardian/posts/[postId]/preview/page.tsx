import Link from "next/link";
import { redirect } from "next/navigation";
import { PostDetailView } from "@/components/posts/post-detail-view";
import { RoutePostDetailView } from "@/components/posts/route-post-detail-view";
import { fetchGuardianPreviewPostById } from "@/lib/guardian-posts-read";
import { verifyPostPreviewToken } from "@/lib/post-preview-token";
import { postHasRouteJourney } from "@/lib/content-post-route";
import { GUARDIAN_WORKSPACE } from "@/lib/mypage/guardian-workspace-routes";

type Props = {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function MypageGuardianPostPreviewPage({ params, searchParams }: Props) {
  const { postId } = await params;
  const { t } = await searchParams;
  const verified = verifyPostPreviewToken(t);
  if (!verified || verified.postId !== postId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-foreground font-medium">Preview link invalid or expired</p>
        <p className="text-muted-foreground mt-2 text-sm">Generate a new preview from the editor.</p>
        <Link href={GUARDIAN_WORKSPACE.posts} className="text-primary mt-6 inline-block text-sm font-semibold underline">
          Back to posts
        </Link>
      </div>
    );
  }

  const post = await fetchGuardianPreviewPostById(postId);
  if (!post) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-foreground font-medium">Could not load this post</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Check Supabase configuration, or save the post to the database first.
        </p>
        <Link
          href={GUARDIAN_WORKSPACE.postEdit(postId)}
          className="text-primary mt-6 inline-block text-sm font-semibold underline"
        >
          Back to editor
        </Link>
      </div>
    );
  }

  if (post.status === "approved") {
    redirect(`/posts/${postId}`);
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/25">
      <p className="text-foreground mx-auto max-w-6xl px-4 py-2 text-center text-xs font-medium sm:px-6">
        Draft / pending preview — not visible on the public site ({post.status})
      </p>
      {postHasRouteJourney(post) ? <RoutePostDetailView post={post} /> : <PostDetailView post={post} />}
    </div>
  );
}
