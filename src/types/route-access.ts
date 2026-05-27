/**
 * 하루루트 결제·접근·공유 정책 타입.
 * 정책 단일 소스: docs/payment-and-share-policy.md
 */

export type RouteAccessSource = "single" | "trio" | "penta" | "admin-comp";

/** 본인이 결제(또는 공급)로 보유한 루트별 권한. */
export interface RouteAccessGrant {
  id: string;
  route_id: string;
  owner_user_id: string;
  source: RouteAccessSource;
  /** ISO timestamp — 결제일로부터 90일 */
  expires_at: string;
  created_at: string;
}

/** Trio/Penta 패키지의 잔여 티켓 상태. */
export interface RouteTicketPack {
  id: string;
  owner_user_id: string;
  pack_size: 3 | 5;
  tickets_used: number;
  /** 패키지 자체 유효기간 (예: 구매 후 12개월) */
  expires_at: string;
  created_at: string;
}

/** 오너가 발급한 공유 초대. grant당 최대 2개 active. */
export interface RouteShareInvite {
  id: string;
  grant_id: string;
  granted_by_user_id: string;
  granted_to_user_id: string;
  status: "active" | "revoked";
  created_at: string;
  revoked_at?: string | null;
}

/** 접근 판정 결과. */
export type RouteAccessReason =
  | "owner"          // 본인이 결제한 grant
  | "shared-invite"  // 공유 초대로 무료 열람
  | "ticket-prompt"  // 잔여 티켓 있음 — 컨펌 다이얼로그 필요
  | "tickets-exhausted" // 보유 패키지 티켓 모두 소진
  | "anonymous"      // 비로그인/비식별
  | "no-access";     // 식별은 됐으나 권한 없음

export interface RouteAccessDecision {
  canView: boolean;
  reason: RouteAccessReason;
  /** owner 또는 shared-invite일 때 만료일 */
  expires_at?: string | null;
  /** shared-invite일 때, 공유해 준 오너 정보 */
  sharedBy?: {
    user_id: string;
    display_name: string;
    avatar_url?: string | null;
  } | null;
  /** ticket-prompt일 때, 남은 티켓 수 */
  ticketsRemaining?: number | null;
  /** ticket-prompt 일 때 사용할 pack id */
  ticketPackId?: string | null;
  /** owner인 경우 grant id (공유 패널 등에서 사용) */
  ownerGrantId?: string | null;
}

export const ROUTE_ACCESS_WINDOW_DAYS = 90;
export const ROUTE_SHARE_INVITE_LIMIT = 2;
