"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

/**
 * 간단한 토글 스위치 — Base UI Switch가 없으면 네이티브 checkbox로 구현.
 */
export function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  "aria-label": ariaLabel,
  className,
}: SwitchProps) {
  const [internal, setInternal] = React.useState(defaultChecked ?? false);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : internal;

  const handleClick = () => {
    if (disabled) return;
    const next = !isOn;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        isOn ? "bg-emerald-500" : "bg-muted-foreground/30",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200",
          isOn ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
