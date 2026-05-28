/** 하루루트 상세 — 공유(재공유) 가능 여부 상태. */
export type ShareCapability =
  | "can_reshare"
  | "owner_manage"
  | "restricted"
  | "private"
  | "expired"
  | "deleted"
  | "blocked"
  | "unknown";

export type RouteShareContext = {
  capability: ShareCapability;
  /** can_reshare일 때 전달할 URL(상대 또는 절대). owner_manage는 패널이 링크 발급. */
  shareUrl: string | null;
};
