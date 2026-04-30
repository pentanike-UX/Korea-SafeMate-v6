import type { RouteSpot } from "@/types/domain";

function norm(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * 무료(접힘) UI — 실제 상호·브랜드(`real_place_name`) 노출을 피하고,
 * 루트 흐름용 러프한 라벨을 고릅니다.
 */
export function roughPlaybookSpotTitle(spot: RouteSpot): string {
  const real = spot.real_place_name?.trim();
  const realN = real ? norm(real) : "";

  const tryPick = (raw: string | undefined): string | null => {
    const t = raw?.trim();
    if (!t) return null;
    if (realN && norm(t) === realN) return null;
    if (realN && norm(t).includes(realN) && norm(t).length <= realN.length + 2) return null;
    return t;
  };

  const ordered: (string | undefined)[] = [
    spot.place_name,
    spot.display_name,
    spot.spot_name,
    spot.short_description?.split(/\n/)[0]?.trim(),
    spot.title,
  ];

  for (const o of ordered) {
    const picked = tryPick(o);
    if (picked) return picked;
  }

  if (spot.district?.trim()) {
    const cat = spot.category?.split(">").pop()?.trim() || "장소";
    return `${spot.district} 근처 ${cat}`;
  }

  return spot.title || spot.place_name || "스팟";
}

/** 유료(펼침) — 실제 장소명 우선 */
export function premiumSpotPlaceTitle(spot: RouteSpot): string {
  return (
    spot.real_place_name?.trim() ||
    spot.display_name?.trim() ||
    spot.spot_name?.trim() ||
    spot.title?.trim() ||
    spot.place_name?.trim() ||
    ""
  );
}
