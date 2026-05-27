"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, Search, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** 공유 시트 내부 단계 — 중첩 Sheet 없이 회원 검색 (z-index 충돌 방지). */
export function RouteOwnerShareMemberSearch({
  searchQ,
  onSearchQChange,
  searchResults,
  searchPending,
  actionPending,
  onBack,
  onPickMember,
  className,
}: {
  searchQ: string;
  onSearchQChange: (q: string) => void;
  searchResults: Array<{ user_id: string; display_name: string; avatar_url?: string | null }>;
  searchPending: boolean;
  actionPending: boolean;
  onBack: () => void;
  onPickMember: (userId: string) => void;
  className?: string;
}) {
  const t = useTranslations("TravelerHub");
  const trimmed = searchQ.trim();
  const showEmpty = trimmed.length >= 2 && !searchPending && searchResults.length === 0;

  return (
    <div className={cn("flex flex-col gap-4 px-6 pb-8 pt-12 sm:px-8 sm:pt-14", className)}>
      <header className="flex items-center gap-2 pr-11">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground hover:bg-muted -ml-1 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
          aria-label={t("routeOwnerShareSearchBack")}
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <h2 className="text-foreground min-w-0 flex-1 font-serif text-xl font-bold tracking-tight">
          {t("routeOwnerShareMemberTitle")}
        </h2>
      </header>

      <label className="border-border/60 focus-within:border-[var(--brand-primary)] flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5">
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

      <ul className="min-h-[12rem] space-y-1.5">
        {trimmed.length < 2 ? (
          <li className="text-muted-foreground py-8 text-center text-sm leading-relaxed">
            {t("routeOwnerShareSearchHint")}
          </li>
        ) : null}
        {showEmpty ? (
          <li className="text-muted-foreground py-8 text-center text-sm">{t("routeOwnerShareSearchNoMatches")}</li>
        ) : null}
        {searchResults.map((m) => (
          <li key={m.user_id}>
            <button
              type="button"
              onClick={() => onPickMember(m.user_id)}
              disabled={actionPending}
              className="hover:bg-muted disabled:opacity-60 flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors"
            >
              <span className="bg-muted size-10 shrink-0 overflow-hidden rounded-full">
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
