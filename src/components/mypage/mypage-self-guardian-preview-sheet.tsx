"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { sameOriginApiUrl } from "@/lib/api-origin";
import type { GuardianProfileSheetPreview } from "@/lib/guardian-profile-sheet-preview";
import { GuardianProfilePreviewPanel } from "@/components/guardians/guardian-profile-preview-sheet-trigger";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MypageSelfGuardianPreviewSheet({
  triggerLabel,
  triggerClassName,
  variant = "outline",
  size = "sm",
}: {
  triggerLabel: string;
  triggerClassName?: string;
  variant?: "outline" | "ghost" | "default";
  size?: "default" | "sm" | "lg";
}) {
  const t = useTranslations("TravelerHub");
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"right" | "bottom">("bottom");
  const [preview, setPreview] = useState<GuardianProfileSheetPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSide(mq.matches ? "right" : "bottom");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void fetch(sameOriginApiUrl("/api/account/guardian-public-preview"), { credentials: "include" })
      .then(async (res) => {
        const data = (await res.json()) as { preview?: GuardianProfileSheetPreview; error?: string };
        if (!res.ok) throw new Error(data.error ?? "error");
        return data.preview ?? null;
      })
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch(() => {
        if (!cancelled) {
          setPreview(null);
          setErr(t("selfGuardianPreviewError"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setPreview(null);
          setErr(null);
        }
      }}
    >
      <Button
        type="button"
        size={size}
        variant={variant}
        className={cn("inline-flex items-center gap-1.5 rounded-[var(--radius-md)] font-semibold", triggerClassName)}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      <SheetContent
        side={side}
        className={cn(
          "flex w-full flex-col gap-0 overflow-hidden p-0",
          side === "right" ? "sm:max-w-md" : "max-h-[90vh] rounded-t-2xl",
        )}
      >
        {loading ? (
          <div className="text-muted-foreground px-5 py-8 text-sm">{t("selfGuardianPreviewLoading")}</div>
        ) : err ? (
          <div className="text-destructive px-5 py-8 text-sm">{err}</div>
        ) : preview ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <GuardianProfilePreviewPanel guardian={preview} onClose={() => setOpen(false)} workspaceSelf />
          </div>
        ) : (
          <div className="text-muted-foreground px-5 py-8 text-sm">{t("selfGuardianPreviewError")}</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
