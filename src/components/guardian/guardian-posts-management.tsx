import { GuardianPostsAttentionStrip } from "@/components/guardian/guardian-posts-attention-strip";
import { GuardianPostsPageBlockBoundary } from "@/components/guardian/guardian-posts-page-block-boundary";
import { Link } from "@/i18n/navigation";
import { listPostsForGuardian } from "@/lib/posts-public";
import { getContentPostFormat, postHasRouteJourney } from "@/lib/content-post-route";
import { isMockGuardianId, resolveMockGuardianUuid } from "@/lib/dev/mock-guardian-auth";
import { GUARDIAN_WORKSPACE } from "@/lib/mypage/guardian-workspace-routes";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MypagePostPreviewSheetTrigger } from "@/components/mypage/mypage-post-preview-sheet-trigger";

function formatLabel(format: ReturnType<typeof getContentPostFormat>) {
  if (format === "hybrid") return "하이브리드";
  if (format === "route") return "루트";
  if (format === "spot") return "스팟";
  return "아티클";
}

export async function GuardianPostsManagement({
  sessionUserId,
  savedBanner,
}: {
  sessionUserId: string;
  savedBanner?: boolean;
}) {
  const sb = createServiceRoleSupabase();
  // mock guardian ID(mg01~mg15)면 실제 UUID로 치환해 DB 조회
  const resolvedUserId = isMockGuardianId(sessionUserId)
    ? (resolveMockGuardianUuid(sessionUserId) ?? sessionUserId)
    : sessionUserId;
  // mock 시드 포스트 (author_user_id === sessionUserId 기준, e.g. "mg10")
  const mockPosts = listPostsForGuardian(sessionUserId);
  let posts = mockPosts;

  if (sb) {
    const { data } = await sb
      .from("content_posts")
      .select("id, author_user_id, title, summary, status, created_at, post_format, route_journey")
      .eq("author_user_id", resolvedUserId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) {
      const dbPosts = data.map((p) => ({
        id: p.id,
        author_user_id: p.author_user_id,
        author_display_name: "",
        region_slug: "seoul",
        category_slug: "hot-places",
        kind: "practical" as const,
        title: p.title ?? "",
        body: "",
        summary: p.summary ?? "",
        status: (
          p.status === "approved" || p.status === "pending" || p.status === "draft" ||
          p.status === "rejected" || p.status === "blocked"
            ? p.status
            : "draft"
        ) as import("@/types/domain").ContentPostStatus,
        created_at: p.created_at ?? new Date().toISOString(),
        tags: [],
        usefulness_votes: 0,
        helpful_rating: null,
        popular_score: 0,
        recommended_score: 0,
        featured: false,
        post_format: (
          p.post_format === "article" || p.post_format === "spot" ||
          p.post_format === "route" || p.post_format === "hybrid"
            ? p.post_format
            : undefined
        ) as import("@/types/domain").ContentPost["post_format"],
        route_journey: undefined,
        route_highlights: [],
        is_sample: false,
      }));
      // DB 포스트 우선, mock 포스트 중 DB에 없는 것만 보충
      const dbIds = new Set(dbPosts.map((p) => p.id));
      const mockOnly = mockPosts.filter((p) => !dbIds.has(p.id));
      posts = [...dbPosts, ...mockOnly].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
  }

  return (
    <GuardianPostsPageBlockBoundary>
      <div className="space-y-8">
      {savedBanner ? (
        <p className="border-primary/20 bg-primary/5 text-foreground rounded-xl border px-4 py-3 text-sm">
          게시 흐름이 기록되었습니다. (MVP: 실제 저장 API는 연결 예정)
        </p>
      ) : null}
      <GuardianPostsAttentionStrip />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary text-[10px] font-bold tracking-widest uppercase">Content</p>
          <h1 className="text-2xl font-semibold tracking-tight">내 포스트</h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm">
            스팟 · 루트 · 하이브리드 포맷을 구분해 표시합니다. (MVP: 로그인·임시 로그인 계정 기준)
          </p>
        </div>
        <Button asChild className="rounded-2xl">
          <Link href={GUARDIAN_WORKSPACE.postsNew}>새 루트 포스트</Link>
        </Button>
      </div>

      <ul className="space-y-3">
        {posts.map((p) => {
          const format = getContentPostFormat(p);
          const route = postHasRouteJourney(p);
          return (
            <li
              key={p.id}
              className="border-border/60 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white/90 p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full text-[10px] font-semibold">
                    {formatLabel(format)}
                  </Badge>
                  {route ? (
                    <Badge variant="secondary" className="rounded-full text-[10px]">
                      지도 {p.route_journey!.spots.length}스팟
                    </Badge>
                  ) : null}
                  <Badge
                    variant={p.status === "approved" ? "default" : "secondary"}
                    className="rounded-full text-[10px] capitalize"
                  >
                    {p.status}
                  </Badge>
                </div>
                <p className="text-foreground mt-2 font-semibold">{p.title || "(제목 없음)"}</p>
                <p className="text-muted-foreground line-clamp-1 text-sm">{p.summary}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <MypagePostPreviewSheetTrigger post={p} triggerLabel="미리보기" />
                {route ? (
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link href={GUARDIAN_WORKSPACE.postEdit(p.id)}>편집</Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground" disabled>
                    루트 전용
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      </div>
    </GuardianPostsPageBlockBoundary>
  );
}
