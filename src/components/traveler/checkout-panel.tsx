"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  tier: "basic" | "standard" | "premium";
  budget: number;
  date: string;
  note: string;
  guardianId?: string;
};

const TIER_PRICE: Record<Props["tier"], number> = {
  basic: 29000,
  standard: 59000,
  premium: 119000,
};

function formatKrw(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function CheckoutPanel({ tier, budget, date, note, guardianId }: Props) {
  const t = useTranslations("TravelerRequest");
  const router = useRouter();
  const [points, setPoints] = useState("0");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const tierPrice = TIER_PRICE[tier];

  const appliedPoints = useMemo(() => {
    const value = Number(points || "0");
    if (!Number.isFinite(value) || value < 0) return 0;
    return Math.min(value, tierPrice);
  }, [points, tierPrice]);

  const payable = Math.max(tierPrice - appliedPoints, 0);

  async function proceedPayment() {
    setApiError(null);
    setLoading(true);
    try {
      // Step 1: Guardian 매칭 요청 (guardianId가 있는 경우)
      if (guardianId) {
        const matchRes = await fetch("/api/traveler/match-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ guardian_user_id: guardianId }),
        });
        if (!matchRes.ok && matchRes.status !== 409) {
          // 409 = already_requested → 중복 요청은 무시하고 진행
          const err = (await matchRes.json().catch(() => null)) as { error?: string } | null;
          if (err?.error !== "already_requested") {
            setApiError("매칭 요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
            return;
          }
        }
      }

      // Step 2: TODO(prod) — PG 결제 연동 (Stripe, Toss 등)
      // 현재는 booking 레코드 생성 후 success 페이지로 이동
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          service_code: `haru_${tier}`,
          tier,
          requested_start_iso: date || null,
          guardian_user_id: guardianId ?? null,
          // TODO(prod): 실 결제 완료 후 payment_status: "paid" 업데이트
          agreements: { scope: true },
          guest_email: "",   // TODO(prod): 로그인 유저 이메일 자동 주입
          guest_name: "",
          traveler_user_type: "traveler",
          region_slug: "seoul",
          preferred_language: "en",
          first_time_in_korea: false,
          meeting_point: "",
          accommodation_area: "",
          interests: [],
          support_needs: [],
          special_requests: note,
          preferred_contact_channel: "app",
          contact_handle: "",
          traveler_count: 1,
        }),
      });

      const booking = (await bookingRes.json().catch(() => null)) as { id?: string } | null;
      const bookingId = booking?.id ?? "mock";

      router.push(`/book/success?id=${bookingId}`);
    } catch {
      setApiError("결제 진행 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6 rounded-[var(--radius-xl)] border border-line bg-bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8">
      <header className="space-y-1">
        <h1 className="font-serif text-2xl font-semibold text-ink">{t("checkoutTitle")}</h1>
        <p className="text-sm text-ink-muted">{t("checkoutLead")}</p>
      </header>

      {/* 주문 요약 */}
      <div className="space-y-2 rounded-[var(--radius-lg)] border border-line-soft bg-bg-sunken p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted">Tier</span>
          <span className="font-semibold text-ink uppercase">{tier}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-muted">Date</span>
          <span className="font-semibold text-ink">{date || "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-muted">Budget</span>
          <span className="font-semibold text-ink">₩{formatKrw(Math.max(0, budget))}</span>
        </div>
        {guardianId && (
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">Guardian</span>
            <span className="font-mono text-xs text-ink-soft">{guardianId.slice(0, 8)}…</span>
          </div>
        )}
        {note && (
          <p className="border-t border-line-whisper pt-2 text-ink-muted text-xs">{note}</p>
        )}
      </div>

      {/* 포인트 입력 */}
      <div className="space-y-2">
        <Label htmlFor="points" className="text-sm font-medium text-ink">
          {t("labelPoints")}
        </Label>
        <Input
          id="points"
          type="number"
          min={0}
          step={100}
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          placeholder="0"
          className="border-line bg-bg text-ink"
        />
      </div>

      {/* 결제 금액 요약 */}
      <div className="space-y-2 rounded-[var(--radius-lg)] border border-line p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted">{t("tierAmount")}</span>
          <span className="font-semibold text-ink">₩{formatKrw(tierPrice)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-muted">{t("pointsApplied")}</span>
          <span className="font-semibold text-ink">− ₩{formatKrw(appliedPoints)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-2">
          <span className="font-semibold text-ink">{t("totalDue")}</span>
          <span className="font-serif text-xl font-bold text-ink">₩{formatKrw(payable)}</span>
        </div>
      </div>

      {apiError && (
        <p className="rounded-[var(--radius-md)] bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {apiError}
        </p>
      )}

      <Button
        type="button"
        className="w-full rounded-[var(--radius-md)] bg-accent-ksm font-semibold text-white hover:bg-accent-dark"
        onClick={() => void proceedPayment()}
        disabled={loading}
      >
        {loading ? t("paying") : t("payBtn")}
      </Button>
    </section>
  );
}
