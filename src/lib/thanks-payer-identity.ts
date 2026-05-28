import type { SupabaseClient } from "@supabase/supabase-js";

export const GUEST_PAYER_KEY_STORAGE = "safemate:guest-payer-key";
export const GUEST_NICKNAME_MIN = 2;
export const GUEST_NICKNAME_MAX = 24;

export type ThanksPayerKind = "member" | "guest";

/** 비회원 닉네임 — 하루이 마이페이지·결제 기록 표시용(욕설·제어문자 최소 필터). */
export function normalizeGuestNickname(raw: string): string | null {
  const trimmed = raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, "");
  if (trimmed.length < GUEST_NICKNAME_MIN || trimmed.length > GUEST_NICKNAME_MAX) return null;
  return trimmed;
}

export function getOrCreateGuestPayerKeyClient(): string {
  if (typeof window === "undefined") return "";
  let key = sessionStorage.getItem(GUEST_PAYER_KEY_STORAGE);
  if (!key) {
    key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(GUEST_PAYER_KEY_STORAGE, key);
  }
  return key;
}

/** 로그인 회원 — user_profiles.display_name → users.legal_name → email 로컬파트 */
export async function resolveMemberPayerDisplayName(
  sb: SupabaseClient,
  payerUserId: string,
): Promise<string> {
  const [{ data: prof }, { data: u }] = await Promise.all([
    sb.from("user_profiles").select("display_name").eq("user_id", payerUserId).maybeSingle(),
    sb.from("users").select("legal_name, email").eq("id", payerUserId).maybeSingle(),
  ]);

  const fromProfile = (prof?.display_name as string | null)?.trim();
  if (fromProfile) return fromProfile;

  const legal = (u?.legal_name as string | null)?.trim();
  if (legal) return legal;

  const email = (u?.email as string | null)?.trim();
  if (email?.includes("@")) return email.split("@")[0]!;

  return "회원";
}

export type ThanksPayerLabelInput = {
  payer_kind: ThanksPayerKind;
  payer_display_name: string | null;
};

/**
 * 하루이 마이페이지 표시 라벨.
 * - 회원: 이름(프로필·이메일 기반 저장값)
 * - 비회원: 「닉네임」 + 비회원 배지 문구는 UI에서 i18n 처리
 */
export function formatThanksPayerLabel(row: ThanksPayerLabelInput): string {
  const name = row.payer_display_name?.trim();
  if (!name) return row.payer_kind === "guest" ? "비회원" : "회원";
  return name;
}
