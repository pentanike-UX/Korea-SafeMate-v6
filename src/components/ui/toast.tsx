"use client";

/**
 * Toast — 알림 시스템
 * Foundation §5.4: success / error / info / warning 4단계
 * 배치: 하단 중앙 (모바일) / 우측 상단 (데스크톱)
 *
 * 사용:
 *   const { toast } = useToast();
 *   toast({ variant: "success", title: "저장됨", description: "루트가 저장됐어요." });
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  durationMs?: number;
}

// ── Context ───────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    ({ durationMs = 4000, ...opts }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).slice(2);
      const item: ToastItem = { id, durationMs, ...opts };
      setItems((prev) => [item, ...prev].slice(0, 5)); // 최대 5개
      setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastViewport items={items} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ── Viewport ──────────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-ok/30 bg-bg-card text-ink [&_[data-icon]]:text-ok",
  error:   "border-accent-ksm/40 bg-bg-card text-ink [&_[data-icon]]:text-accent-ksm",
  info:    "border-ink-whisper bg-bg-card text-ink [&_[data-icon]]:text-ink-muted",
  warning: "border-gold/40 bg-bg-card text-ink [&_[data-icon]]:text-gold",
};

const VARIANT_ICONS: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg data-icon viewBox="0 0 20 20" fill="currentColor" className="size-5 shrink-0" aria-hidden>
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg data-icon viewBox="0 0 20 20" fill="currentColor" className="size-5 shrink-0" aria-hidden>
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg data-icon viewBox="0 0 20 20" fill="currentColor" className="size-5 shrink-0" aria-hidden>
      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg data-icon viewBox="0 0 20 20" fill="currentColor" className="size-5 shrink-0" aria-hidden>
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  ),
};

function ToastViewport({
  items,
  dismiss,
}: {
  items: ToastItem[];
  dismiss: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className={cn(
        "fixed z-50 flex flex-col gap-2",
        // 모바일: 하단 중앙 / 데스크톱: 우측 상단
        "bottom-4 left-1/2 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2",
        "sm:left-auto sm:right-4 sm:bottom-auto sm:top-4 sm:translate-x-0",
      )}
    >
      {items.map((item) => (
        <ToastRoot key={item.id} item={item} dismiss={dismiss} />
      ))}
    </div>
  );
}

// ── Toast Item ────────────────────────────────────────────────────────────────

function ToastRoot({ item, dismiss }: { item: ToastItem; dismiss: (id: string) => void }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-lg)] border px-4 py-3 shadow-[var(--shadow-md)]",
        "animate-in slide-in-from-bottom-2 duration-200",
        VARIANT_STYLES[item.variant],
      )}
    >
      {VARIANT_ICONS[item.variant]}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">{item.description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="닫기"
        className="shrink-0 rounded-[var(--radius-sm)] p-1 text-ink-soft transition-colors hover:bg-bg-sunken hover:text-ink"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden>
          <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
    </div>
  );
}
