"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TIERS = [
  { id: "basic",    nameKey: "Basic",    price: 29000,  descKey: "1일 루트" },
  { id: "standard", nameKey: "Standard", price: 59000,  descKey: "3일 루트" },
  { id: "premium",  nameKey: "Premium",  price: 119000, descKey: "최대 7일 루트" },
] as const;

function formatKrw(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

/** 오늘 날짜 (YYYY-MM-DD) — 과거 날짜 선택 방지 */
function todayIso() {
  return new Date().toISOString().split("T")[0]!;
}

type Props = {
  /** Guardian 프로필에서 "요청하기" 클릭 시 전달되는 UUID */
  guardianId?: string;
};

export function CustomRequestForm({ guardianId }: Props) {
  const t = useTranslations("TravelerRequest");
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
      setError(t("errorDate"));
      return;
    }
    if (!budget || Number(budget) <= 0) {
      setError(t("errorBudget"));
      return;
    }

    const params = new URLSearchParams({
      date,
      budget,
      tier,
      note: note.trim(),
      ...(guardianId ? { guardianId } : {}),
    });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <section className="space-y-6 rounded-[var(--radius-xl)] border border-line bg-bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8">
      <header className="space-y-1">
        <h1 className="font-serif text-2xl font-semibold text-ink">{t("formTitle")}</h1>
        <p className="text-sm text-ink-muted">{t("formLead")}</p>
      </header>

      {/* 가디언 선택 표시 */}
      {guardianId && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-accent-soft bg-accent-soft/30 px-4 py-2.5">
          <span className="text-xs font-semibold text-accent-dark">{t("guardianLabel")}:</span>
          <span className="font-mono text-xs text-ink-muted">{guardianId.slice(0, 8)}…</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="request-date" className="text-sm font-medium text-ink">
            {t("labelDate")}
          </Label>
          <Input
            id="request-date"
            type="date"
            min={todayIso()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="border-line bg-bg text-ink"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="request-budget" className="text-sm font-medium text-ink">
            {t("labelBudget")}
          </Label>
          <Input
            id="request-budget"
            type="number"
            min={10000}
            step={1000}
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            placeholder={t("budgetPlaceholder")}
            className="border-line bg-bg text-ink"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-ink">{t("labelTier")}</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {TIERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTier(item.id)}
              className={cn(
                "rounded-[var(--radius-lg)] border px-4 py-3 text-left transition-colors",
                tier === item.id
                  ? "border-accent-ksm bg-accent-soft/40 text-ink"
                  : "border-line bg-bg hover:bg-bg-sunken",
              )}
            >
              <p className="text-sm font-semibold text-ink">{item.nameKey}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{item.descKey}</p>
              <p className="mt-2 text-xs font-semibold text-accent-ksm">₩{formatKrw(item.price)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="request-note" className="text-sm font-medium text-ink">
          {t("labelNote")}
        </Label>
        <Textarea
          id="request-note"
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("notePlaceholder")}
          className="border-line bg-bg text-ink placeholder:text-ink-whisper"
        />
      </div>

      {/* 선택 요약 */}
      <div className="rounded-[var(--radius-md)] border border-line-soft bg-bg-sunken px-4 py-3 text-sm text-ink-muted">
        {t("tierSummary", {
          tier: selectedTier.nameKey,
          price: formatKrw(selectedTier.price),
        })}
      </div>

      {error && (
        <p className="rounded-[var(--radius-md)] bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Button
        type="button"
        className="w-full rounded-[var(--radius-md)] bg-accent-ksm font-semibold text-white hover:bg-accent-dark"
        onClick={submit}
      >
        {t("proceedBtn")}
      </Button>
    </section>
  );
}
