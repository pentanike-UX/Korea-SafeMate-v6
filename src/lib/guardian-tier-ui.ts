import type { GuardianTier } from "@/types/domain";

/** 등급·역할(기여자 포함) 뱃지 — 카드/상세/리스트 동일 규칙 */
export const GUARDIAN_TIER_ROLE_BADGE_CLASSNAME =
  "min-h-[1.375rem] shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold leading-tight";

type BadgeVariant =
  | "default"
  | "secondary"
  | "trust"
  | "featured"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

export function guardianTierLabel(tier: GuardianTier): string {
  const map: Record<GuardianTier, string> = {
    contributor: "Contributor",
    active_guardian: "Active Guardian",
    verified_guardian: "Verified Guardian",
  };
  return map[tier];
}

export function guardianTierDescription(tier: GuardianTier): string {
  const map: Record<GuardianTier, string> = {
    contributor: "Can share local intel; not eligible for paid matching on its own.",
    active_guardian: "Meets contribution cadence; still separate from matching approval.",
    verified_guardian: "Ops-verified for trusted support & matching after policy checks.",
  };
  return map[tier];
}

export function guardianTierBadgeVariant(tier: GuardianTier): BadgeVariant {
  switch (tier) {
    case "verified_guardian":
      return "default";
    case "active_guardian":
      return "trust";
    default:
      return "outline";
  }
}
