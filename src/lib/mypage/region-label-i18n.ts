import { regionKeyFromSlug } from "@/lib/mypage/traveler-hub-region-key";

/** 슬라그를 읽기 쉬운 라틴 표기로(폴백). */
export function formatRegionSlugForDisplay(slug: string): string {
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" · ");
}

/**
 * `TravelerHub` 네임스페이스의 `t`로 지역 라벨을 맞춘다.
 * `regionKeyFromSlug`에 걸리면 `region.{key}`, 아니면 `formatRegionSlugForDisplay`.
 */
export function regionDisplayLabelFromSlug(
  slug: string | null | undefined,
  tTravelerHub: (key: string) => string,
): string {
  const s = slug?.trim() ?? "";
  if (!s) return tTravelerHub("requestsRegionUnknown");

  const key = regionKeyFromSlug(s);
  if (key) return tTravelerHub(`region.${key}`);
  return formatRegionSlugForDisplay(s);
}
