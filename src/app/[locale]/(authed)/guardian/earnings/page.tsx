import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("GuardianOps");
  return { title: `${t("earningsTitle")} — ${BRAND.name}` };
}

/**
 * KRW 포맷 — gross_amount_krw_cents 컬럼은 Stripe 관례 따라 정수(KRW) 저장.
 * KRW는 소수점 없는 통화이므로 /100 변환 불필요.
 * TODO(prod): 실제 Stripe webhook 이벤트 기준 단위 재확인 후 필요 시 조정.
 */
function formatKrw(krw: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(krw);
}

const PAYOUT_STYLES: Record<string, string> = {
  pending:    "bg-gold/15 text-gold border-gold/30",
  processing: "bg-muted/60 text-muted-foreground border-border/60",
  paid:       "bg-ok/15 text-ok border-ok/30",
  failed:     "bg-destructive/10 text-destructive border-destructive/30",
};

export default async function GuardianEarningsPage() {
  const t = await getTranslations("GuardianOps");

  // Auth guard는 layout.tsx에서 처리됨. 빌드타임 fallback 방어.
  const sb = await getServerSupabaseForUser();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: rows } = await sb!
    .from("orders")
    .select(
      "id, booking_id, payment_status, payout_status, gross_amount_krw_cents, guardian_payout_krw_cents, paid_at, paid_out_at, created_at",
    )
    .eq("guardian_user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = rows ?? [];
  let totalGross = 0;
  let totalPayout = 0;
  let pendingPayout = 0;

  for (const r of list) {
    totalGross   += r.gross_amount_krw_cents ?? 0;
    totalPayout  += r.guardian_payout_krw_cents ?? 0;
    if (r.payout_status !== "paid") pendingPayout += r.guardian_payout_krw_cents ?? 0;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{t("earningsTitle")}</h1>
        <p className="text-sm text-ink-muted">{t("earningsLead")}</p>
      </div>

      {/* 요약 카드 3종 */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: t("earningsTotalGross"),  value: totalGross,   accent: false },
          { label: t("earningsTotalPayout"), value: totalPayout,  accent: false },
          { label: t("earningsPending"),     value: pendingPayout, accent: pendingPayout > 0 },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            className={[
              "rounded-[var(--radius-xl)] border p-5 space-y-1",
              accent ? "border-accent-ksm/30 bg-accent-soft/20" : "border-line bg-bg-card",
            ].join(" ")}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">{label}</p>
            <p className={`font-serif text-2xl font-bold ${accent ? "text-accent-dark" : "text-ink"}`}>
              {formatKrw(value)}
            </p>
          </div>
        ))}
      </div>

      {/* 주문 목록 */}
      {list.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-line bg-bg-card p-8 text-center space-y-3">
          <p className="text-sm text-ink-muted">{t("earningsEmpty")}</p>
          <Button asChild variant="outline" className="rounded-[var(--radius-md)] border-line">
            <Link href="/guardian/orders">{t("earningsViewOrders")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => {
            const payoutStyle = PAYOUT_STYLES[r.payout_status] ?? PAYOUT_STYLES.pending;
            return (
              <li key={r.id}>
                <div className="rounded-[var(--radius-xl)] border border-line bg-bg-card p-4 shadow-[var(--shadow-sm)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      {/* 결제/정산 상태 뱃지 */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-line bg-bg-sunken px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                          {t("earningsPayment")}: {r.payment_status}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${payoutStyle}`}>
                          {t("earningsPayout")}: {r.payout_status}
                        </span>
                      </div>

                      {/* 금액 */}
                      <p className="text-sm text-ink">
                        <span className="text-ink-muted text-xs">{t("earningsGuardianPayout")}</span>{" "}
                        <span className="font-semibold">{formatKrw(r.guardian_payout_krw_cents ?? 0)}</span>
                      </p>
                    </div>

                    <Button asChild variant="outline" size="sm" className="rounded-[var(--radius-md)] border-line text-ink-muted">
                      <Link href={`/guardian/orders/${r.booking_id}`}>
                        {t("ordersWorkspace")} →
                      </Link>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
