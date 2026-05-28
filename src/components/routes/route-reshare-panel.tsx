"use client";

import { useTranslations } from "next-intl";
import { Copy, MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

/**
 * 공유받은(또는 열람 가능한) 방문자용 재공유 패널.
 * 새 invite/소유권 생성 없이 현재 share URL을 전달한다.
 */
export function RouteResharePanel({
  shareUrl,
  className,
}: {
  shareUrl: string;
  className?: string;
}) {
  const t = useTranslations("TravelerHub");
  const { toast } = useToast();

  const absoluteUrl =
    typeof window !== "undefined" && shareUrl.startsWith("/")
      ? `${window.location.origin}${shareUrl}`
      : shareUrl;

  async function onNativeShare() {
    const title = t("routeReshareShareTitle");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: t("routeReshareShareBody"),
          url: absoluteUrl,
        });
        return;
      } catch {
        /* 사용자 취소 — clipboard 폴백 */
      }
    }
    await onCopy();
  }

  async function onCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast({ variant: "error", title: t("routeOwnerShareLinkCopyErr") });
      return;
    }
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      toast({
        variant: "success",
        title: t("routeOwnerShareLinkCopyOk"),
        description: absoluteUrl,
        durationMs: 7000,
      });
    } catch {
      toast({ variant: "error", title: t("routeOwnerShareLinkCopyErr") });
    }
  }

  return (
    <div className={cn("flex flex-col gap-5 px-6 pb-8 pt-12 sm:px-8 sm:pt-14", className)}>
      <header className="pr-11">
        <h2 className="text-foreground font-serif text-xl font-bold tracking-tight sm:text-2xl">
          {t("routeReshareTitle")}
        </h2>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed whitespace-pre-line">
          {t("routeReshareLead")}
        </p>
      </header>

      <section className="border-border/60 bg-card rounded-2xl border p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void onNativeShare()}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 text-sm font-bold text-[var(--text-on-brand)] shadow-sm transition-all hover:opacity-95"
          >
            <MessageCircle className="size-4" aria-hidden />
            {t("routeOwnerShareLinkShareCta")}
          </button>
          <button
            type="button"
            onClick={() => void onCopy()}
            className="border-border/60 hover:bg-muted text-foreground flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold transition-colors"
          >
            <Copy className="size-4" aria-hidden />
            {t("routeOwnerShareLinkCopyCta")}
          </button>
        </div>

        <div className="bg-background/80 border-border/60 mt-3 flex items-center gap-2 overflow-hidden rounded-lg border px-2 py-1.5">
          <input
            readOnly
            value={absoluteUrl}
            onFocus={(e) => e.currentTarget.select()}
            onClick={(e) => e.currentTarget.select()}
            aria-label={t("routeOwnerShareLinkUrlLabel")}
            className="text-foreground min-w-0 flex-1 bg-transparent font-mono text-[11px] outline-none selection:bg-[var(--brand-primary)]/20"
          />
          <button
            type="button"
            onClick={() => void onCopy()}
            aria-label={t("routeOwnerShareLinkCopyCta")}
            className="text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
          >
            <Copy className="size-3.5" aria-hidden />
          </button>
        </div>
      </section>
    </div>
  );
}

/** 짧은 권한 확인 중 — 최대 2초만 노출. */
export function RouteShareCheckingPlaceholder() {
  const t = useTranslations("TravelerHub");
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden />
      <p className="text-muted-foreground text-sm">{t("routeOwnerShareLoading")}</p>
    </div>
  );
}
