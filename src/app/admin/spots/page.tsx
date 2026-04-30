/**
 * /admin/spots — 스팟 카탈로그 관리
 * 장소 검색(Naver) → 카탈로그 등록 → 이미지 타입별 관리
 */
import Link from "next/link";
import { AdminOpsPillarHeader } from "@/components/admin/admin-ops-pillar";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { Badge } from "@/components/ui/badge";
import { listSpotCatalog } from "@/lib/spot-catalog-server";
import type { SpotCatalogEntry } from "@/types/domain";

export const metadata = {
  title: "Spot Catalog | Admin",
};

const CATEGORY_LABEL: Record<SpotCatalogEntry["category"], string> = {
  food: "🍜 음식",
  cafe: "☕ 카페",
  attraction: "🏛 명소",
  shopping: "🛍 쇼핑",
  nightlife: "🌙 나이트",
  nature: "🌿 자연",
  activity: "🎯 액티비티",
};

function ImageStrategyBadge({ strategy }: { strategy: SpotCatalogEntry["image_strategy"] }) {
  const map: Record<typeof strategy, { label: string; cls: string }> = {
    practical: { label: "현장형", cls: "bg-sky-50 text-sky-700 border-sky-200/60" },
    aesthetic: { label: "감성형", cls: "bg-violet-50 text-violet-700 border-violet-200/60" },
    mixed: { label: "혼합", cls: "bg-muted text-muted-foreground" },
  };
  const { label, cls } = map[strategy] ?? map.mixed;
  return (
    <Badge variant="outline" className={`text-[10px] font-semibold ${cls}`}>
      {label}
    </Badge>
  );
}

export default async function AdminSpotsPage() {
  const spots = await listSpotCatalog({ limit: 100 });

  const verified = spots.filter((s) => s.is_verified).length;
  const hasImages = spots.filter((s) => s.primary_image_url).length;
  const withNaver = spots.filter((s) => s.naver_place_id).length;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <AdminOpsPillarHeader
          pillar="content"
          title="Spot Catalog"
          description="장소 마스터 데이터 관리 — Naver 검색으로 등록 후 이미지 타입별 큐레이션"
        />
        <h1 className="text-foreground mt-4 text-2xl font-semibold tracking-tight">
          스팟 카탈로그
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          하루웨이에서 재사용 가능한 장소 마스터. Naver Local Search로 장소를 찾아 등록하고,
          이미지 타입(hero / practical / walking / timing / night)별로 큐레이션합니다.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <AdminStatCard label="전체 스팟" value={spots.length} hint="spot_catalog 총 수" />
        <AdminStatCard label="검증 완료" value={verified} hint="is_verified = true" />
        <AdminStatCard label="이미지 있음" value={hasImages} hint="hero primary 등록됨" />
        <AdminStatCard label="Naver 연동" value={withNaver} hint="naver_place_id 있음" />
      </div>

      {/* Search & Add */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/spots/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          + Naver에서 장소 추가
        </Link>
        <p className="text-muted-foreground text-xs">
          Naver Local Search API로 장소를 검색 → 카탈로그에 등록 → 이미지 큐레이션
        </p>
      </div>

      {/* Spots table */}
      {spots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 px-6 py-12 text-center">
          <p className="text-muted-foreground text-sm font-medium">등록된 스팟이 없습니다.</p>
          <p className="text-muted-foreground mt-1 text-xs">
            &ldquo;Naver에서 장소 추가&rdquo; 버튼으로 첫 번째 스팟을 등록해 보세요.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  장소명
                </th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:table-cell">
                  카테고리
                </th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase md:table-cell">
                  이미지 전략
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  이미지
                </th>
                <th className="px-4 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {spots.map((spot) => (
                <tr key={spot.id} className="hover:bg-muted/20 transition-colors">
                  {/* Name */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{spot.name_ko}</p>
                    {spot.district ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{spot.district}</p>
                    ) : spot.address_ko ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {spot.address_ko}
                      </p>
                    ) : null}
                  </td>

                  {/* Category */}
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="text-xs text-foreground/80">
                      {CATEGORY_LABEL[spot.category] ?? spot.category}
                    </span>
                  </td>

                  {/* Image strategy */}
                  <td className="hidden px-4 py-3 md:table-cell">
                    <ImageStrategyBadge strategy={spot.image_strategy} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="outline"
                        className={
                          spot.is_verified
                            ? "text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "text-[10px] text-muted-foreground"
                        }
                      >
                        {spot.is_verified ? "검증됨" : "미검증"}
                      </Badge>
                      {spot.naver_place_id ? (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Naver ✓
                        </Badge>
                      ) : null}
                    </div>
                  </td>

                  {/* Image */}
                  <td className="px-4 py-3">
                    {spot.primary_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={spot.primary_image_url}
                        alt={spot.name_ko}
                        className="size-12 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/30">
                        <span className="text-[10px] text-muted-foreground">없음</span>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/spots/${spot.id}`}
                      className="rounded-md border border-border/50 bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
                    >
                      관리
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Architecture note */}
      <section className="rounded-xl border border-border/40 bg-muted/20 p-5 text-sm">
        <p className="font-semibold text-foreground mb-3">이미지 타입 기준</p>
        <ul className="space-y-2 text-muted-foreground">
          {[
            ["hero", "대표 썸네일·상단 hero — 장소를 가장 잘 표현하는 1장"],
            ["practical", "현장 실사용 — 입구·좌석·계산대·동선 등 실용 정보"],
            ["walking", "이동 방향·보행 흐름 — 다음 스팟으로 가는 길"],
            ["timing", "혼잡도·빛 조건 — 오전/오후별 차이, 줄 서는 곳"],
            ["night", "야간 전용 — 야경·조명·야간 운영 여부 확인용"],
          ].map(([type, desc]) => (
            <li key={type} className="flex gap-2.5">
              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-foreground">
                {type}
              </code>
              <span className="text-xs">{desc}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground/70">
          Naver API 환경변수 설정:{" "}
          <code className="font-mono">NAVER_CLIENT_ID</code>,{" "}
          <code className="font-mono">NAVER_CLIENT_SECRET</code> (Vercel 서버 전용)
        </p>
      </section>
    </div>
  );
}
