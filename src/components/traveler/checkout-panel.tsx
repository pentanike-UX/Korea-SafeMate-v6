"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  tier: "basic" | "standard" | "premium";
  budget: number;
  date: string;
  note: string;
};

const TIER_PRICE: Record<Props["tier"], number> = {
  basic: 29000,
  standard: 59000,
  premium: 119000,
};

function formatKrw(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function CheckoutPanel({ tier, budget, date, note }: Props) {
  const router = useRouter();
  const [points, setPoints] = useState("0");
  const [loading, setLoading] = useState(false);
  const tierPrice = TIER_PRICE[tier];

  const appliedPoints = useMemo(() => {
    const value = Number(points || "0");
    if (!Number.isFinite(value) || value < 0) return 0;
    return Math.min(value, tierPrice);
  }, [points, tierPrice]);

  const payable = Math.max(tierPrice - appliedPoints, 0);

  async function proceedPayment() {
    setLoading(true);
    try {
      // TODO(prod): 실제 PG 결제 연동
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/book/success?id=mock-checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Checkout</h1>
        <p className="text-sm text-muted-foreground">요청 티어와 포인트를 확인하고 결제를 진행하세요.</p>
      </header>

      <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-4 text-sm">
        <p>
          티어: <span className="font-semibold text-foreground">{tier.toUpperCase()}</span>
        </p>
        <p>
          일정: <span className="font-semibold text-foreground">{date || "-"}</span>
        </p>
        <p>
          입력 예산: <span className="font-semibold text-foreground">₩{formatKrw(Math.max(0, budget))}</span>
        </p>
        {note ? <p className="text-muted-foreground">요청 메모: {note}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="points">사용 포인트</Label>
        <Input
          id="points"
          type="number"
          min={0}
          step={100}
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          placeholder="0"
        />
      </div>

      <div className="space-y-2 rounded-xl border border-border/50 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">티어 금액</span>
          <span className="font-semibold text-foreground">₩{formatKrw(tierPrice)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">포인트 사용</span>
          <span className="font-semibold text-foreground">- ₩{formatKrw(appliedPoints)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border/60 pt-2">
          <span className="text-foreground font-semibold">최종 결제 금액</span>
          <span className="text-lg font-semibold text-foreground">₩{formatKrw(payable)}</span>
        </div>
      </div>

      <Button type="button" className="w-full rounded-xl font-semibold" onClick={() => void proceedPayment()} disabled={loading}>
        {loading ? "결제 준비 중..." : "결제 진행"}
      </Button>
    </section>
  );
}
