import { mockLaunchAreas } from "@/data/mock/launch-areas";
import type { LaunchAreaSlug } from "@/types/launch-area";

/** 런칭 가능한 지역만 선택 가능 (서울 권역: 광화문·강남). 부산·제주 등은 제외 */
export function isLaunchAreaSelectable(slug: LaunchAreaSlug | ""): boolean {
  if (!slug) return false;
  const row = mockLaunchAreas.find((a) => a.slug === slug);
  return Boolean(row?.active && !row.comingSoon);
}
