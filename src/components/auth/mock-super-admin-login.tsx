"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { loginAsMockSuperAdmin } from "@/lib/dev/login-as-mock-super-admin";
import { cn } from "@/lib/utils";

interface Props {
  /** 로그인 후 이동할 경로. 없으면 /ko/posts 로 이동합니다. */
  nextPath?: string;
  className?: string;
}

/**
 * Dev/demo 전용 — 슈퍼관리자 모의 로그인 버튼.
 * 이 컴포넌트는 NODE_ENV !== "production" 일 때만 렌더링해야 합니다.
 * (부모 서버 컴포넌트에서 조건부 렌더링으로 제어)
 */
export function MockSuperAdminLogin({ nextPath, className }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await loginAsMockSuperAdmin();
      if (!result.ok) {
        setError("슈퍼관리자 로그인 실패");
        setBusy(false);
        return;
      }
      window.location.assign(nextPath ?? "/ko/posts");
    } catch {
      setError("요청 중 오류가 발생했습니다");
      setBusy(false);
    }
  };

  return (
    <div className={cn("mb-3", className)}>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleClick()}
        className={cn(
          "group flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left transition-all duration-200",
          "border-emerald-500/40 bg-emerald-50/60 hover:border-emerald-500/70 hover:bg-emerald-50",
          "dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 dark:border-emerald-500/30",
          "focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:outline-none",
          "active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55",
          "shadow-[var(--shadow-sm)]",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
          <ShieldCheck className="size-[18px]" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">슈퍼관리자</p>
          <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70">페이월 없이 모든 하루웨이 열람</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
            "border-emerald-500/50 bg-emerald-600 text-white",
            "group-hover:bg-emerald-700",
          )}
        >
          {busy ? "…" : "로그인"}
        </span>
      </button>
      {error ? (
        <p className="mt-1.5 text-center text-xs text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
