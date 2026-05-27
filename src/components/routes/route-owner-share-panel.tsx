"use client";

import { useTranslations } from "next-intl";
import { UserPlus, X, Users, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 오너용 공유 패널 — grant당 최대 2명 무료 초대.
 * 정책: docs/payment-and-share-policy.md §3
 *
 * Phase 3N: 회원 검색 발급(legacy) + 토큰 링크 발급(권장)을 함께 표시.
 *   - user_id 채워짐 + pending=false → 회원에게 직접 발급되어 redeem 완료
 *   - user_id 채워짐 + pending=true → 토큰이 redeem된 직후 상태 (실질 pending=false와 동치, 안전 디폴트)
 *   - user_id NULL + pending=true → 토큰 발급 후 아직 redeem 대기 (invite_token 채워짐)
 */
export interface ShareInviteSlot {
  invite_id: string;
  user_id: string | null;
  display_name: string;
  avatar_url?: string | null;
  invite_token?: string | null;
  pending?: boolean;
}

export function RouteOwnerSharePanel({
  invites,
  onInvite,
  onCreateLink,
  onShareLink,
  onCopyLink,
  onRevoke,
  className,
  linkBusy = false,
  hasActiveLink = false,
}: {
  invites: ShareInviteSlot[];
  /** 기존 회원 검색 시트 트리거 (보조 경로). */
  onInvite: () => void;
  /** Phase 3N — 새 토큰 링크 발급 트리거. */
  onCreateLink: () => void;
  /** 발급된 링크를 시스템 share UI로 공유 (없으면 자동 생성). */
  onShareLink: () => void;
  /** 발급된 링크를 클립보드 복사 (없으면 자동 생성). */
  onCopyLink: () => void;
  onRevoke: (inviteId: string) => void;
  className?: string;
  linkBusy?: boolean;
  /** redeem 대기 중인 토큰이 있는지 — 카피/공유 버튼 상태 분기용. */
  hasActiveLink?: boolean;
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
        {t("routeOwnerShareLinkHint")}
      </p>

      {/* Phase 3N — 토큰 링크 카드 (권장 경로). 한 번에 시스템 공유 / 복사 / 새로 만들기 */}
      <div
        className={cn(
          "mb-3 flex flex-col gap-2 rounded-xl border p-3",
          hasActiveLink
            ? "border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/[0.04]"
            : "border-border/60 bg-background/40",
        )}
      >
        <div className="flex items-center gap-2">
          <Link2 className="size-4 text-[var(--brand-primary)]" aria-hidden />
          <p className="text-foreground text-sm font-bold">{t("routeOwnerShareLinkTitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onShareLink}
            disabled={linkBusy || remaining === 0 && !hasActiveLink}
            className="flex h-9 flex-1 min-w-[140px] items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 text-sm font-bold text-[var(--text-on-brand)] shadow-sm transition-all hover:opacity-95 disabled:opacity-60"
          >
            {t("routeOwnerShareLinkShareCta")}
          </button>
          <button
            type="button"
            onClick={onCopyLink}
            disabled={linkBusy || (remaining === 0 && !hasActiveLink)}
            className="border-border/60 hover:bg-muted text-foreground flex h-9 flex-1 min-w-[120px] items-center justify-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {t("routeOwnerShareLinkCopyCta")}
          </button>
        </div>
        {remaining === 0 && !hasActiveLink ? (
          <p className="text-[11px] text-amber-600">{t("routeOwnerShareLinkLimitFull")}</p>
        ) : (
          <p className="text-muted-foreground text-[11px]">{t("routeOwnerShareLinkSubHint")}</p>
        )}
      </div>

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
              slot.pending && !slot.user_id ? (
                <>
                  <span className="bg-[var(--brand-primary)]/15 flex size-7 shrink-0 items-center justify-center rounded-full">
                    <Link2 className="size-3.5 text-[var(--brand-primary)]" aria-hidden />
                  </span>
                  <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
                    {t("routeOwnerShareLinkPendingLabel")}
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
              )
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
                  className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-2 py-1 text-xs font-semibold transition-colors"
                >
                  {t("routeOwnerShareInviteCta")}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* onCreateLink는 직접 호출하지 않고 onShareLink/onCopyLink에서 자동으로 호출되는 패턴.
          별도 'create' 버튼이 필요하면 여기에 노출 가능. */}
      <div className="sr-only" aria-hidden onClick={onCreateLink} />
    </section>
  );
}

/** 첫 슬롯도 모두 비어있을 때 짧은 안내. */
export function RouteOwnerShareEmptyHint() {
  const t = useTranslations("TravelerHub");
  return <p className="text-muted-foreground text-[11px]">{t("routeOwnerShareEmpty")}</p>;
}
