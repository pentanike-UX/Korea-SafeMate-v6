"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TIERS = [
  { id: "basic", name: "Basic", price: 29000, desc: "1일 루트 추천" },
  { id: "standard", name: "Standard", price: 59000, desc: "3일 루트 설계" },
  { id: "premium", name: "Premium", price: 119000, desc: "최대 7일 맞춤 플랜" },
] as const;

function formatKrw(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function CustomRequestForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("");
  const [tier, setTier] = useState<(typeof TIERS)[number]["id"]>("standard");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedTier = useMemo(() => TIERS.find((item) => item.id === tier) ?? TIERS[1], [tier]);

  function submit() {
    setError(null);
    if (!date) {
      setError("여행 날짜를 선택해 주세요.");
      return;
    }
    if (!budget || Number(budget) <= 0) {
      setError("예산을 입력해 주세요.");
      return;
    }

    const params = new URLSearchParams({
      date,
      budget,
      tier,
      note: note.trim(),
    });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <section className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">맞춤 루트 요청</h1>
        <p className="text-sm text-muted-foreground">날짜·예산·티어를 입력하면 결제 단계로 이동합니다.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="request-date">여행 날짜</Label>
          <Input id="request-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="request-budget">예산 (KRW)</Label>
          <Input
            id="request-budget"
            type="number"
            min={10000}
            step={1000}
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            placeholder="예: 120000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>요청 티어</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {TIERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTier(item.id)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-colors",
                tier === item.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/60",
              )}
            >
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
              <p className="mt-2 text-xs font-medium">₩{formatKrw(item.price)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="request-note">요청 메모</Label>
        <Textarea
          id="request-note"
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="원하는 분위기, 이동 제약, 선호 장소 등을 적어 주세요."
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        선택 티어: <span className="font-semibold text-foreground">{selectedTier.name}</span> · 예상 기본가{" "}
        <span className="font-semibold text-foreground">₩{formatKrw(selectedTier.price)}</span>
      </div>

      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <Button type="button" className="w-full rounded-xl font-semibold" onClick={submit}>
        체크아웃으로 이동
      </Button>
    </section>
  );
}
