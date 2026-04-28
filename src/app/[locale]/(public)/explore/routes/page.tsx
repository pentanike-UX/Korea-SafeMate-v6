/**
 * 루트 목록 페이지 — /explore/routes
 * 가디언이 작성한 route journey가 포함된 포스트만 표시.
 */
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listApprovedRoutePostsMerged } from "@/lib/posts-public-merged.server";
import { postCoverImageUrl } from "@/lib/content-post-route";
import { BRAND } from "@/lib/constants";
import { MapPin, Clock, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("Nav");
  return {
    title: `${t("explore")} — ${BRAND.name}`,
    description: "가디언이 직접 만든 서울 하루 루트 목록",
  };
}

export default async function ExploreRoutesPage() {
  const routes = await listApprovedRoutePostsMerged();

  return (
    <main className="min-h-screen bg-bg">
      {/* 헤더 */}
      <div className="border-b border-line bg-bg-card">
        <div className="page-container py-10 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-2">
            가디언이 만든 루트
          </p>
          <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
            서울 하루, 골라보세요
          </h1>
          <p className="mt-2 text-sm text-ink-muted max-w-md">
            현지 가디언이 직접 설계한 하루 동선입니다. 그대로 따라가면 됩니다.
          </p>
        </div>
      </div>

      {/* 루트 카드 그리드 */}
      <div className="page-container py-10 md:py-14">
        {routes.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border border-dashed border-line bg-bg-card p-12 text-center">
            <p className="text-sm font-semibold text-ink">루트가 곧 추가됩니다</p>
            <p className="mt-1 text-xs text-ink-muted">가디언들이 루트를 준비 중입니다.</p>
            <Link
              href="/explore"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-ksm hover:text-accent-dark"
            >
              가디언 목록 보기 →
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((post) => {
              const coverUrl = postCoverImageUrl(post);
              const spots = post.route_journey?.spots ?? [];
              const meta = post.route_journey?.metadata;
              const durationMin = meta?.estimated_total_duration_minutes;
              const allTags = post.tags.slice(0, 3);

              return (
                <li key={post.id}>
                  <Link
                    href={`/posts/${post.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-line bg-bg-card transition-shadow hover:shadow-[var(--shadow-md)]"
                  >
                    {/* 커버 이미지 or 플레이스홀더 */}
                    <div className="relative h-40 w-full overflow-hidden bg-bg-sunken">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverUrl}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <MapPin className="size-8 text-line" strokeWidth={1.5} />
                        </div>
                      )}
                      {/* 스팟 수 배지 */}
                      {spots.length > 0 && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-bg-dark/80 px-2.5 py-0.5 text-[10px] font-semibold text-bg backdrop-blur-sm">
                          스팟 {spots.length}곳
                        </span>
                      )}
                    </div>

                    {/* 카드 본문 */}
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      {/* 태그 */}
                      {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {allTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-accent-ksm/10 px-2 py-0.5 text-[10px] font-semibold text-accent-ksm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 제목 */}
                      <h2 className="font-serif text-base font-semibold text-ink leading-snug line-clamp-2 group-hover:text-accent-ksm transition-colors">
                        {post.title}
                      </h2>

                      {/* 요약 */}
                      {post.summary && (
                        <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">{post.summary}</p>
                      )}

                      {/* 메타 */}
                      <div className="mt-auto flex items-center justify-between pt-2 border-t border-line-whisper">
                        <div className="flex items-center gap-3 text-[10px] text-ink-soft">
                          {durationMin && (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" strokeWidth={1.75} />
                              약 {Math.round(durationMin / 60)}시간
                            </span>
                          )}
                          <span className="font-medium text-ink-muted">{post.author_display_name}</span>
                        </div>
                        <ArrowRight className="size-4 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-accent-ksm" strokeWidth={1.75} />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
