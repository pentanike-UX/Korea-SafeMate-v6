"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { resolveGuardianDisplayName } from "@/data/mock/guardian-seed-display-names";
import { GUARDIAN_SEED_ROWS } from "@/data/mock/guardians-seed";
import { loginAsMockGuardian } from "@/lib/dev/login-as-mock-guardian";
import { guardianProfileImageUrlsFromIndex } from "@/lib/guardian-profile-images";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tierBadgeClass: Record<string, string> = {
  Starter: "border-muted-foreground/30 bg-muted/50 text-muted-foreground",
  Active: "border-[var(--brand-trust-blue)]/35 bg-[var(--brand-trust-blue-soft)]/50 text-[var(--brand-trust-blue)]",
  Pro: "border-primary/30 bg-primary/10 text-primary",
  Elite: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
};

export function MockGuardianQuickLogin({ className }: { className?: string }) {
  const t = useTranslations("Login");
  const locale = useLocale();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const onPick = async (guardianId: string) => {
    setPendingId(guardianId);
    try {
      const sb = createSupabaseBrowserClient();
      await sb?.auth.signOut();
      const result = await loginAsMockGuardian(guardianId);
      if (!result.ok) {
        setPendingId(null);
        return;
      }
      window.location.assign(`/${locale}/mypage?segment=guardian`);
    } catch {
      setPendingId(null);
    }
  };

  return (
    <section
      className={cn(
        "border-border/60 bg-muted/20 mt-8 rounded-[var(--radius-md)] border border-dashed px-4 py-4 sm:px-5",
        className,
      )}
      aria-label={t("devMockGuardianTitle")}
    >
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">{t("devMockGuardianEyebrow")}</p>
      <h2 className="text-muted-foreground mt-1 text-sm font-medium">{t("devMockGuardianTitle")}</h2>
      <p className="text-muted-foreground/90 mt-2 text-xs leading-relaxed">{t("devMockGuardianHint")}</p>
      <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
        {GUARDIAN_SEED_ROWS.map((row) => {
          const busy = pendingId === row.id;
          const displayName = resolveGuardianDisplayName(row.id, row.display_name);
          const { avatar } = guardianProfileImageUrlsFromIndex(row.profile_image_index);
          const initial = displayName.slice(0, 1).toUpperCase();
          return (
            <li key={row.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onPick(row.id)}
                className={cn(
                  "group border-border/70 bg-card/60 hover:border-[color-mix(in_srgb,var(--brand-trust-blue)_28%,var(--border))] hover:bg-card focus-visible:ring-ring flex w-full min-h-[4.5rem] items-center gap-3 rounded-[var(--radius-md)] border px-3 py-3 text-left shadow-[var(--shadow-sm)] transition-[border-color,background-color,transform,box-shadow] duration-200 sm:min-h-[4.75rem] sm:gap-3.5 sm:px-4 sm:py-3.5",
                  "active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  "disabled:pointer-events-none disabled:opacity-55",
                )}
              >
                <Avatar className="size-11 shrink-0 ring-1 ring-border/50 sm:size-12">
                  <AvatarImage src={avatar} alt="" />
                  <AvatarFallback className="text-sm font-semibold">{initial}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-semibold sm:text-[15px]">{displayName}</p>
                  <Badge
                    variant="outline"
                    className={cn("mt-1.5 px-2 py-0.5 text-[10px] font-semibold", tierBadgeClass[row.product_tier])}
                  >
                    {row.product_tier}
                  </Badge>
                </div>
                <span
                  className={cn(
                    "border-border/80 bg-background text-foreground group-hover:border-[color-mix(in_srgb,var(--brand-trust-blue)_35%,var(--border))] group-hover:bg-[var(--brand-trust-blue-soft)]/35 group-active:bg-muted shrink-0 rounded-[var(--radius-md)] border px-3 py-2.5 text-xs font-semibold shadow-sm transition-colors sm:px-3.5 sm:py-3 sm:text-sm",
                  )}
                >
                  {busy ? "…" : t("devMockGuardianLoginButton")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
