"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link2, MessageCircle, Copy, UserPlus, X, Search, Loader2 } from "lucide-react";
import { RouteOwnerShareMemberSearchInline } from "@/components/routes/route-owner-share-member-search";
import { cn } from "@/lib/utils";

/**
 * 오너용 공유 패널 — grant당 최대 2명 무료 초대.
 * 정책: docs/payment-and-share-policy.md §3
 *
 * Phase 3O: 링크 흐름과 회원 검색 흐름을 별도 카드로 완전 분리.
 *   - 카드 A) 친구에게 링크로 보내기: 카톡/메시지(시스템 share) + 링크 복사.
 *            pending(아직 redeem 안 된) 토큰이 발급되어 있으면 그 슬롯을 카드 내에 노출.
 *   - 카드 B) 회원에게 직접 무료 전달: 회원 검색 시트 열기 + redeem된 회원 슬롯 노출.
 *
 * variant:
 *   - "sheet" → 시트 전체에 여유있게 배치(섹션 헤더가 시트의 메인 타이틀 역할).
 *   - "inline" → 좁은 카드 안 (현재는 사용처 없음, 호환용).
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
  memberSearchOpen,
  onMemberSearchOpenChange,
  memberSearchQ,
  onMemberSearchQChange,
  memberSearchResults,
  memberSearchPending,
  memberInvitePending,
  onPickMember,
  onShareLink,
  onCopyLink,
  onRevoke,
  linkBusy = false,
  variant = "sheet",
  className,
  activeLinkUrl = null,
}: {
  invites: ShareInviteSlot[];
  memberSearchOpen: boolean;
  onMemberSearchOpenChange: (open: boolean) => void;
  memberSearchQ: string;
  onMemberSearchQChange: (q: string) => void;
  memberSearchResults: Array<{ user_id: string; display_name: string; avatar_url?: string | null }>;
  memberSearchPending: boolean;
  memberInvitePending: boolean;
  onPickMember: (userId: string) => void;
  onShareLink: () => void;
  onCopyLink: () => void;
  onRevoke: (inviteId: string) => void;
  linkBusy?: boolean;
  variant?: "sheet" | "inline";
  className?: string;
  /** 발급된 활성 토큰의 fully-qualified URL — 카드 안에 readonly 박스로 표시. */
  activeLinkUrl?: string | null;
}) {
  const t = useTranslations("TravelerHub");
  const linkSlots = invites.filter((iv) => iv.pending && !iv.user_id);
  const memberSlots = invites.filter((iv) => Boolean(iv.user_id));
  const used = invites.length;
  const remaining = Math.max(0, 2 - used);
  const limitFull = remaining === 0;

  const isSheet = variant === "sheet";
  const memberSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!memberSearchOpen || !memberSectionRef.current) return;
    memberSectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [memberSearchOpen]);

  return (
    <div
      className={cn(
        isSheet ? "flex flex-col gap-5 px-6 pb-8 pt-12 sm:px-8 sm:pt-14" : "flex flex-col gap-4 p-4",
        className,
      )}
    >
      {/* 시트 닫기(X)와 겹치지 않도록 우측 여백 확보 */}
      <header className="pr-11">
        <h2 className="text-foreground font-serif text-xl font-bold tracking-tight sm:text-2xl">
          {t("routeOwnerShareTitle")}
        </h2>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
          {t("routeOwnerShareLeadV2")}
        </p>
        <span
          className={cn(
            "mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold tabular-nums",
            limitFull
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]",
          )}
        >
          {t("routeOwnerShareLimit", { n: remaining })}
        </span>
      </header>

      {/* ── A) 링크로 보내기 ──────────────────────────────────────────────── */}
      <section
        className={cn(
          "rounded-2xl border bg-card p-5 shadow-sm",
          linkSlots.length > 0
            ? "border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/[0.03]"
            : "border-border/60",
        )}
      >
        <div className="mb-3 flex items-center gap-2.5">
          <span className="bg-[var(--brand-primary)]/15 flex size-9 shrink-0 items-center justify-center rounded-xl">
            <Link2 className="size-4.5 text-[var(--brand-primary)]" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-bold">{t("routeOwnerShareLinkTitle")}</p>
            <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
              {t("routeOwnerShareLinkSubHint")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onShareLink}
            disabled={linkBusy || (limitFull && linkSlots.length === 0)}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 text-sm font-bold text-[var(--text-on-brand)] shadow-sm transition-all hover:opacity-95 disabled:opacity-50"
          >
            {linkBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <MessageCircle className="size-4" aria-hidden />
            )}
            {t("routeOwnerShareLinkShareCta")}
          </button>
          <button
            type="button"
            onClick={onCopyLink}
            disabled={linkBusy || (limitFull && linkSlots.length === 0)}
            className="border-border/60 hover:bg-muted text-foreground flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Copy className="size-4" aria-hidden />
            {t("routeOwnerShareLinkCopyCta")}
          </button>
        </div>

        {/* 활성 링크 — URL 박스 1개로 통합 (pending 행과 중복 표시 제거) */}
        {activeLinkUrl && linkSlots[0] ? (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-[11px] font-medium">
                {t("routeOwnerShareLinkPendingLabel")}
              </p>
              <button
                type="button"
                onClick={() => onRevoke(linkSlots[0]!.invite_id)}
                aria-label={t("routeOwnerShareSlotRevoke")}
                className="text-muted-foreground hover:text-foreground text-[11px] font-medium underline-offset-2 hover:underline"
              >
                {t("routeOwnerShareSlotRevoke")}
              </button>
            </div>
            <div className="bg-background/80 border-border/60 flex items-center gap-2 overflow-hidden rounded-lg border px-2 py-1.5">
              <input
                readOnly
                value={activeLinkUrl}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
                aria-label={t("routeOwnerShareLinkUrlLabel")}
                className="text-foreground min-w-0 flex-1 bg-transparent font-mono text-[11px] outline-none selection:bg-[var(--brand-primary)]/20"
              />
              <button
                type="button"
                onClick={onCopyLink}
                disabled={linkBusy}
                aria-label={t("routeOwnerShareLinkCopyCta")}
                className="text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-50"
              >
                <Copy className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>
        ) : linkSlots.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {linkSlots.map((slot) => (
              <li
                key={slot.invite_id}
                className="border-border/40 bg-background/60 flex items-center gap-2 rounded-lg border p-2"
              >
                <Link2 className="text-[var(--brand-primary)] size-3.5 shrink-0" aria-hidden />
                <span className="text-foreground min-w-0 flex-1 truncate text-xs font-medium">
                  {t("routeOwnerShareLinkPendingLabel")}
                </span>
                <button
                  type="button"
                  onClick={() => onRevoke(slot.invite_id)}
                  aria-label={t("routeOwnerShareSlotRevoke")}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded-full transition-colors"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {limitFull && linkSlots.length === 0 ? (
          <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400">
            {t("routeOwnerShareLinkLimitFull")}
          </p>
        ) : null}
      </section>

      {/* ── B) 회원 검색으로 직접 전달 (검색 UI는 이 카드 안에서 펼침) ───── */}
      <section
        ref={memberSectionRef}
        className={cn(
          "rounded-2xl border bg-card p-5 shadow-sm transition-colors",
          memberSearchOpen
            ? "border-[var(--brand-primary)]/45 ring-1 ring-[var(--brand-primary)]/20"
            : "border-border/60",
        )}
      >
        <div className="mb-3 flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              memberSearchOpen ? "bg-[var(--brand-primary)]/15" : "bg-muted/80",
            )}
          >
            <Search
              className={cn(
                "size-4.5",
                memberSearchOpen ? "text-[var(--brand-primary)]" : "text-muted-foreground",
              )}
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-bold">{t("routeOwnerShareMemberTitle")}</p>
            <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
              {t("routeOwnerShareMemberSubHint")}
            </p>
          </div>
        </div>

        {!memberSearchOpen ? (
          <button
            type="button"
            onClick={() => onMemberSearchOpenChange(true)}
            disabled={limitFull && memberSlots.length === 0}
            aria-expanded={false}
            className="border-border/60 hover:bg-muted text-foreground flex h-11 w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <UserPlus className="size-4" aria-hidden />
            {t("routeOwnerShareMemberCta")}
          </button>
        ) : (
          <RouteOwnerShareMemberSearchInline
            searchQ={memberSearchQ}
            onSearchQChange={onMemberSearchQChange}
            searchResults={memberSearchResults}
            searchPending={memberSearchPending}
            actionPending={memberInvitePending}
            onClose={() => onMemberSearchOpenChange(false)}
            onPickMember={onPickMember}
          />
        )}

        {memberSlots.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {memberSlots.map((slot) => (
              <li
                key={slot.invite_id}
                className="border-border/40 bg-background/60 flex items-center gap-2 rounded-lg border p-2"
              >
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
                  className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded-full transition-colors"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {limitFull && memberSlots.length === 0 ? (
          <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400">
            {t("routeOwnerShareLinkLimitFull")}
          </p>
        ) : null}
      </section>

      <p className="text-muted-foreground text-center text-[11px] leading-relaxed">
        {t("routeOwnerShareFooterHint")}
      </p>
    </div>
  );
}
