"use client";

import { useTranslations } from "next-intl";
import { Loader2, Search, UserCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** 회원 카드(B) 안에서 펼쳐지는 인라인 검색 — 별도 시트/화면 전환 없음. */
export function RouteOwnerShareMemberSearchInline({
  searchQ,
  onSearchQChange,
  searchResults,
  searchPending,
  actionPending,
  onClose,
  onPickMember,
  className,
}: {
  searchQ: string;
  onSearchQChange: (q: string) => void;
  searchResults: Array<{ user_id: string; display_name: string; avatar_url?: string | null }>;
  searchPending: boolean;
  actionPending: boolean;
  onClose: () => void;
  onPickMember: (userId: string) => void;
  className?: string;
}) {
  const t = useTranslations("TravelerHub");
  const trimmed = searchQ.trim();
  const showEmpty = trimmed.length >= 2 && !searchPending && searchResults.length === 0;

  return (
    <div
      className={cn(
        "mt-3 space-y-3 rounded-xl border border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/[0.04] p-3",
        className,
      )}
      role="region"
      aria-label={t("routeOwnerShareInviteCta")}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-foreground text-xs font-bold">{t("routeOwnerShareInviteCta")}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-7 shrink-0 items-center justify-center rounded-full transition-colors"
          aria-label={t("routeOwnerShareSearchClose")}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <label className="border-border/60 focus-within:border-[var(--brand-primary)] flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
        <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <input
          autoFocus
          value={searchQ}
          onChange={(e) => onSearchQChange(e.target.value)}
          placeholder={t("routeOwnerShareSearchPlaceholder")}
          className="text-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        {searchPending ? <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" /> : null}
      </label>

      <ul className="max-h-[min(40vh,16rem)] space-y-1 overflow-y-auto overscroll-contain">
        {trimmed.length < 2 ? (
          <li className="text-muted-foreground px-1 py-4 text-center text-xs leading-relaxed">
            {t("routeOwnerShareSearchHint")}
          </li>
        ) : null}
        {showEmpty ? (
          <li className="text-muted-foreground px-1 py-4 text-center text-xs">{t("routeOwnerShareSearchNoMatches")}</li>
        ) : null}
        {searchResults.map((m) => (
          <li key={m.user_id}>
            <button
              type="button"
              onClick={() => onPickMember(m.user_id)}
              disabled={actionPending}
              className="hover:bg-muted/80 disabled:opacity-60 flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors"
            >
              <span className="bg-muted size-9 shrink-0 overflow-hidden rounded-full">
                {m.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={m.avatar_url} alt="" className="size-full object-cover" />
                ) : null}
              </span>
              <span className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold">
                {m.display_name}
              </span>
              {actionPending ? (
                <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
              ) : (
                <UserCheck className="text-[var(--brand-primary)] size-4 shrink-0" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
