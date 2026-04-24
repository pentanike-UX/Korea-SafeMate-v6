"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  selected: boolean;
  onToggle: () => void;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** `aria-label` 후보 — 스크린리더용 */
  name: string;
};

/** 홈 퀵스타트 · 여행 무드 선택 전용 앱형 옵션 카드 */
export function HomeMoodOptionCard({ selected, onToggle, icon: Icon, title, subtitle, name }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={name}
      className={cn(
        "group text-left transition-[transform,box-shadow,background-color,border-color] duration-200",
        "rounded-[var(--radius-lg)] border-2 bg-card p-5 sm:p-6",
        "hover:shadow-md hover:bg-muted/25",
        "active:scale-[0.99]",
        "focus-visible:ring-[var(--brand-trust-blue)] focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:outline-none",
        selected
          ? "border-[var(--brand-trust-blue)] bg-[color-mix(in_srgb,var(--brand-trust-blue-soft)_50%,var(--card))] shadow-md"
          : "border-border/70 shadow-[var(--shadow-sm)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={cn(
            "flex size-[3.25rem] shrink-0 items-center justify-center rounded-[var(--radius-md)] border transition-colors duration-200",
            selected
              ? "border-[color-mix(in_srgb,var(--brand-trust-blue)_30%,var(--border))] bg-background text-[var(--text-strong)]"
              : "border-border/60 bg-muted/35 text-[var(--text-secondary)] group-hover:bg-muted/55 group-hover:text-foreground",
          )}
        >
          <Icon className="size-[1.35rem]" strokeWidth={1.65} aria-hidden />
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
            selected
              ? "border-[var(--brand-trust-blue)] bg-[var(--brand-trust-blue)] text-white shadow-sm"
              : "border-border bg-muted/30 group-hover:border-[var(--brand-trust-blue)]/40",
          )}
          aria-hidden
        >
          {selected ? <Check className="size-[1.05rem] stroke-[2.75]" /> : null}
        </span>
      </div>
      <h4 className="text-foreground mt-5 text-base font-semibold leading-snug tracking-tight sm:mt-6 sm:text-[17px]">
        {title}
      </h4>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-[15px]">{subtitle}</p>
    </button>
  );
}
