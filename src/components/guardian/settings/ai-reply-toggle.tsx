"use client";

import { useCallback, useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Bot, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "saving" | "error";

export function AiReplyToggle() {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    fetch("/api/guardian/ai-reply-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { ai_auto_reply_enabled: boolean } | null) => {
        if (data) setEnabled(data.ai_auto_reply_enabled);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, []);

  const handleToggle = useCallback(
    async (next: boolean) => {
      setEnabled(next);
      setStatus("saving");
      try {
        const res = await fetch("/api/guardian/ai-reply-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ai_auto_reply_enabled: next }),
        });
        if (!res.ok) throw new Error("save failed");
        setStatus("idle");
      } catch {
        setEnabled(!next); // 롤백
        setStatus("error");
      }
    },
    [],
  );

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Bot className="size-4 text-violet-500" aria-hidden />
          AI 자동답변
        </p>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          켜두면 여행자 메시지에 AI가 즉시 초안 답변을 보냅니다.
          <br />
          AI 답변은 가디언 로그인 시{" "}
          <span className="inline-flex items-center gap-0.5 rounded bg-violet-100 px-1 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
            <Bot className="size-2.5" />
            AI
          </span>{" "}
          아이콘으로 표시됩니다.
        </p>
        {status === "error" && (
          <p className="text-[11px] text-red-500">저장 실패. 다시 시도해 주세요.</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
        {status === "saving" || status === "loading" ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            checked={enabled}
            onCheckedChange={(v) => void handleToggle(v)}
            disabled={status !== "idle"}
            aria-label="AI 자동답변 켜기/끄기"
          />
        )}
        <span className="text-[10px] font-semibold text-muted-foreground">
          {enabled ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
}
