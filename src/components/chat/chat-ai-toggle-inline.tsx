"use client";

/**
 * 인박스 채팅 뷰 안에 노출되는 작은 AI 자동답변 토글.
 * 가디언이 별도 설정 페이지 가지 않아도 바로 ON/OFF.
 *
 * - mount 시 GET /api/guardian/ai-reply-settings → 현재 상태 로드
 * - 클릭 시 PATCH → 즉시 토글, 실패하면 롤백
 * - 모의 가디언(mgXX)도 정상 작동 (API에서 service_role + UUID 매핑 처리)
 */

import { useCallback, useEffect, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "loading" | "idle" | "saving" | "error";

export function ChatAiToggleInline() {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/guardian/ai-reply-settings", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { ai_auto_reply_enabled?: boolean } | null) => {
        if (cancelled) return;
        if (data && typeof data.ai_auto_reply_enabled === "boolean") {
          setEnabled(data.ai_auto_reply_enabled);
        }
        setStatus("idle");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(async () => {
    if (status === "loading" || status === "saving") return;
    const next = !enabled;
    setEnabled(next);
    setStatus("saving");
    try {
      const res = await fetch("/api/guardian/ai-reply-settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_auto_reply_enabled: next }),
      });
      if (!res.ok) throw new Error("save failed");
      setStatus("idle");
    } catch {
      setEnabled(!next);
      setStatus("error");
    }
  }, [enabled, status]);

  return (
    <div
      className={cn(
        "mb-2 flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5 text-xs",
        enabled
          ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/30 dark:text-violet-300"
          : "border-border/60 bg-muted/40 text-muted-foreground",
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-1.5 leading-tight">
        <Bot className={cn("size-4 shrink-0", enabled ? "text-violet-500" : "text-muted-foreground")} aria-hidden />
        <span className="truncate">
          AI 자동답변 <span className="font-semibold">{enabled ? "ON" : "OFF"}</span>
          {enabled ? <span className="ml-1 hidden sm:inline">— 여행자 메시지에 초안이 자동 전송됩니다</span> : null}
        </span>
      </span>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={status === "loading" || status === "saving"}
        aria-pressed={enabled}
        aria-label="AI 자동답변 켜기/끄기"
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          enabled ? "bg-violet-500" : "bg-muted-foreground/30",
          status === "loading" || status === "saving" ? "opacity-60" : "",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 transform rounded-full bg-white shadow transition-transform",
            enabled ? "translate-x-4" : "translate-x-0.5",
          )}
        />
        {status === "saving" || status === "loading" ? (
          <Loader2 className="absolute inset-0 m-auto size-3 animate-spin text-white/80" aria-hidden />
        ) : null}
      </button>
    </div>
  );
}
