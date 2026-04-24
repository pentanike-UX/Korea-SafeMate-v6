import type { LaunchAreaSlug } from "@/types/launch-area";

export type ExploreFitLineKey =
  | "fitLineKpop"
  | "fitLineGwanghwamun"
  | "fitLineFirstVisit"
  | "fitLinePhoto"
  | "fitLineWalking";

type Pace = "calm" | "balanced" | "packed";

/**
 * 추천 결과 카드 한 줄 이유 — 문구 풀을 조건에 맞게 쌓고, 카드 순번으로 순환해 다양하게 보이게 한다.
 */
export function exploreGuardianFitLineKeys(
  region: LaunchAreaSlug | "",
  theme: string,
  pace: Pace,
): ExploreFitLineKey[] {
  const keys: ExploreFitLineKey[] = [];
  if (theme === "k_pop_day") keys.push("fitLineKpop");
  if (region === "gwanghwamun") keys.push("fitLineGwanghwamun");
  if (theme === "photo_route") keys.push("fitLinePhoto");
  if (pace === "calm" || theme === "safe_solo") keys.push("fitLineFirstVisit");
  keys.push("fitLineWalking");
  return [...new Set(keys)];
}

export function exploreGuardianFitLineKeyAtIndex(
  region: LaunchAreaSlug | "",
  theme: string,
  pace: Pace,
  index: number,
): ExploreFitLineKey {
  const list = exploreGuardianFitLineKeys(region, theme, pace);
  return list[index % list.length]!;
}

/** 조건 매칭 우선, 나머지는 일정한 순서로 이어 붙여 1·2·3순위 문구가 겹치지 않게 한다. */
const ALL_KEYS_FALLBACK_ORDER: ExploreFitLineKey[] = [
  "fitLineGwanghwamun",
  "fitLineKpop",
  "fitLinePhoto",
  "fitLineFirstVisit",
  "fitLineWalking",
];

export function exploreOrderedFitKeys(
  region: LaunchAreaSlug | "",
  theme: string,
  pace: Pace,
): ExploreFitLineKey[] {
  const matched = exploreGuardianFitLineKeys(region, theme, pace);
  const rest = ALL_KEYS_FALLBACK_ORDER.filter((k) => !matched.includes(k));
  return [...matched, ...rest];
}

export function exploreTopPickBulletKeys(
  region: LaunchAreaSlug | "",
  theme: string,
  pace: Pace,
): [ExploreFitLineKey, ExploreFitLineKey, ExploreFitLineKey] {
  const o = exploreOrderedFitKeys(region, theme, pace);
  const n = o.length;
  return [o[0 % n]!, o[1 % n]!, o[2 % n]!];
}

export function exploreCompareCardKeys(
  region: LaunchAreaSlug | "",
  theme: string,
  pace: Pace,
  rank: 2 | 3,
): { strength: ExploreFitLineKey; reason: ExploreFitLineKey; diff: ExploreFitLineKey } {
  const o = exploreOrderedFitKeys(region, theme, pace);
  const n = o.length;
  const base = rank === 2 ? 3 : 4;
  return {
    strength: o[base % n]!,
    reason: o[(base + 1) % n]!,
    diff: o[(base + 2) % n]!,
  };
}
