/**
 * 루트 목록 페이지 — /explore/routes
 * 가디언이 작성한 route journey가 포함된 포스트만 표시.
 */
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listApprovedRoutePostsMerged } from "@/lib/posts-public-merged.server";
import { ExploreRouteCard } from "@/components/explore/explore-route-card";
import { BRAND } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("Nav");
  return {
    title: `${t("explore")} — ${BRAND.name}`,
    description: "하루이가 직접 만든 서울 하루웨이 목록",
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
            하루이가 만든 하루웨이
          </p>
          <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
            서울 하루, 골라보세요
          </h1>
          <p className="mt-2 text-sm text-ink-muted max-w-md">
            현지 하루이가 직접 설계한 하루 동선입니다. 그대로 따라가면 됩니다.
          </p>
        </div>
      </div>

      {/* 루트 카드 그리드 */}
      <div className="page-container py-10 md:py-14">
        {routes.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border border-dashed border-line bg-bg-card p-12 text-center">
            <p className="text-sm font-semibold text-ink">루트가 곧 추가됩니다</p>
            <p className="mt-1 text-xs text-ink-muted">하루이들이 하루웨이를 준비 중입니다.</p>
            <Link
              href="/explore"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-ksm hover:text-accent-dark"
            >
              하루이 목록 보기 →
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((post) => (
              <ExploreRouteCard key={post.id} post={post} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
