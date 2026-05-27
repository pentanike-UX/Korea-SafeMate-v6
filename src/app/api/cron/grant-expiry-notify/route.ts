/**
 * Cron — owner의 grant 만료가 임박/도래한 경우 알림 dedup row를 큐에 INSERT.
 * 정책: docs/payment-and-share-policy.md §6
 *
 * Vercel Cron이 GET으로 호출 — `vercel.json`의 crons 항목에 path/schedule 등록.
 * `CRON_SECRET` 환경변수가 설정돼 있으면 Authorization Bearer로 일치 확인(보안).
 *
 * 동작:
 *  1) expires_at이 (now + 72h) 이내·(now + 24h) 이내·(now 이전 24h 이내)인 grant 조회.
 *  2) 각 (grant_id, kind) 쌍에 대해 dedup INSERT (UNIQUE 충돌은 무시).
 *  3) 결과 카운트 JSON으로 응답.
 */

import { NextResponse } from "next/server";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HOUR = 60 * 60 * 1000;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // 미설정 시 통과(dev/staging).
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request): Promise<Response> {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const svc = createServiceRoleSupabase();
  if (!svc) return NextResponse.json({ ok: false, error: "service-role-unavailable" }, { status: 500 });

  const now = Date.now();
  const horizons: Array<{ kind: "72h" | "24h" | "expired"; from: Date; to: Date }> = [
    { kind: "72h", from: new Date(now + 48 * HOUR), to: new Date(now + 72 * HOUR) }, // 48~72h 남은 것
    { kind: "24h", from: new Date(now), to: new Date(now + 24 * HOUR) }, // 0~24h 남은 것
    { kind: "expired", from: new Date(now - 24 * HOUR), to: new Date(now) }, // 최근 24h 내 만료
  ];

  const result: Record<string, { matched: number; queued: number; skipped: number }> = {};

  for (const h of horizons) {
    const { data: grants } = await svc
      .from("route_access_grants")
      .select("id")
      .gte("expires_at", h.from.toISOString())
      .lt("expires_at", h.to.toISOString());
    const rows = (grants ?? []) as Array<{ id: string }>;
    let queued = 0;
    let skipped = 0;
    for (const g of rows) {
      // UNIQUE (grant_id, kind) 충돌 시 무시(이미 큐잉됨).
      const { error } = await svc
        .from("route_grant_expiry_notifications")
        .insert({ grant_id: g.id, kind: h.kind });
      if (error) {
        if (error.code === "23505") skipped += 1;
      } else {
        queued += 1;
      }
    }
    result[h.kind] = { matched: rows.length, queued, skipped };
  }

  return NextResponse.json({ ok: true, ts: new Date().toISOString(), result });
}
