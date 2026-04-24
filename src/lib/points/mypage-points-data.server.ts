import { cache } from "react";
import { getMockGuardianSeedPoints } from "@/lib/dev/mock-guardian-auth";
import { fetchBalanceSnapshot, fetchLedgerForUser } from "@/lib/points/point-ledger-service";
import { getActivePointPolicy } from "@/lib/points/point-policy-repository";
import { buildMockGuardianLedger } from "@/lib/points/mock-guardian-ledger";
import type { MypagePointsApiResponse, PointLedgerRow } from "@/lib/points/types";

/** 시트·API·허브 카드가 같은 원장 상한을 쓰도록 고정 (과도한 페이로드 방지) */
export const MYPAGE_POINTS_LEDGER_LIMIT = 100;

export type MypagePointsData = {
  balance: number;
  earned: number;
  revoked: number;
  ledger: PointLedgerRow[];
  policy: Awaited<ReturnType<typeof getActivePointPolicy>>;
  usesMockLedger: boolean;
};

export function toMypagePointsApiResponse(userId: string, data: MypagePointsData): MypagePointsApiResponse {
  return {
    balance: {
      user_id: userId,
      balance: data.balance,
      lifetime_earned: data.earned,
      lifetime_revoked: data.revoked,
      updated_at: null,
    },
    ledger: data.ledger,
    policy: data.policy,
  };
}

/**
 * 단일 RSC 요청(레이아웃 + 하위 페이지)에서 `loadMypagePointsData` 중복 호출을 합친다.
 */
export const getMypagePointsBundleCached = cache(async (userId: string) => {
  const data = await loadMypagePointsData(userId, MYPAGE_POINTS_LEDGER_LIMIT);
  return { data, api: toMypagePointsApiResponse(userId, data) };
});

export async function loadMypagePointsData(userId: string, ledgerLimit = MYPAGE_POINTS_LEDGER_LIMIT): Promise<MypagePointsData> {
  const mockSeedPoints = getMockGuardianSeedPoints(userId);
  const policy = await getActivePointPolicy();

  if (mockSeedPoints !== null) {
    const ledger = buildMockGuardianLedger(userId, policy) as PointLedgerRow[];
    const balance = ledger.reduce((s, r) => s + r.amount, 0);
    const earned = ledger.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
    const revoked = Math.abs(ledger.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0));
    return { balance, earned, revoked, ledger, policy, usesMockLedger: true };
  }

  const [snap, ledgerFromDb] = await Promise.all([
    fetchBalanceSnapshot(userId),
    fetchLedgerForUser(userId, ledgerLimit),
  ]);
  return {
    balance: snap?.balance ?? 0,
    earned: snap?.lifetime_earned ?? 0,
    revoked: snap?.lifetime_revoked ?? 0,
    ledger: ledgerFromDb as PointLedgerRow[],
    policy,
    usesMockLedger: false,
  };
}
