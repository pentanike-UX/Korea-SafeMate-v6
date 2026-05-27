"use client";

import { useTranslations } from "next-intl";
import { UserPlus, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 오너용 공유 패널 — grant당 최대 2명 무료 초대.
 * 정책: docs/payment-and-share-policy.md §3
 *
 * Phase 3A: mock UI. 실제 검색·발급은 Phase 3B에서 서버 액션과 연동.
 */
export interface ShareInviteSlot {
  invite_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
}

export function RouteOwnerSharePanel({
  invites,
  onInvite,
  onRevoke,
  className,
}: {
  invites: ShareInviteSlot[];
  onInvite: () => void; // open member search sheet
  onRevoke: (inviteId: string) => void;
  className?: string;
}) {
  const t = useTranslations("TravelerHub");
  const slots: (ShareInviteSlot | null)[] = [invites[0] ?? null, invites[1] ?? null];
  const used = invites.length;
  const remaining = Math.max(0, 2 - used);

  return (
    <section
      className={cn(
        "border-border/60 bg-card rounded-2xl border p-4 text-left shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-[var(--brand-primary)]" aria-hidden />
          <p className="text-foreground text-sm font-bold">{t("routeOwnerShareTitle")}</p>
        </div>
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {t("routeOwnerShareLimit", { n: remaining })}
        </span>
      </div>
      <p className="text-muted-foreground mb-3 text-[11px] leading-relaxed">
        {t("routeOwnerShareHint")}
      </p>
      <ul className="space-y-2">
        {slots.map((slot, idx) => (
          <li
            key={slot?.invite_id ?? `empty-${idx}`}
            className={cn(
              "border-border/50 flex items-center gap-2 rounded-xl border bg-background/40 p-2",
              !slot && "border-dashed",
            )}
          >
            {slot ? (
              <>
                <span className="bg-muted size-7 shrink-0 overflow-hidden rounded-full">
                  {slot.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={slot.avatar_url} alt="" className="size-full object-cover" />
                  ) : null}
                </span>
                <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
                  {slot.display_name}
                </span>
                <button
                  type="button"
                  onClick={() => onRevoke(slot.invite_id)}
                  aria-label={t("routeOwnerShareSlotRevoke")}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-full transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </>
            ) : (
              <>
                <span className="bg-muted/60 flex size-7 shrink-0 items-center justify-center rounded-full">
                  <UserPlus className="text-muted-foreground size-3.5" aria-hidden />
                </span>
                <span className="text-muted-foreground flex-1 text-sm">
                  {t("routeOwnerShareSlotEmpty")}
                </span>
                <button
                  type="button"
                  onClick={onInvite}
                  className="text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/8 rounded-md px-2 py-1 text-xs font-bold transition-colors"
                >
                  {t("routeOwnerShareInviteCta")}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 첫 슬롯도 모두 비어있을 때 짧은 안내. */
export function RouteOwnerShareEmptyHint() {
  const t = useTranslations("TravelerHub");
  return <p className="text-muted-foreground text-[11px]">{t("routeOwnerShareEmpty")}</p>;
}
