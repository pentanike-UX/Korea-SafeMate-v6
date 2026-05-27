"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Search, Loader2, UserCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  RouteOwnerSharePanel,
  type ShareInviteSlot,
} from "@/components/routes/route-owner-share-panel";
import {
  createRouteShareInviteAction,
  listRouteShareInvitesAction,
  revokeRouteShareInviteAction,
  searchMembersForInviteAction,
} from "@/lib/route-access-actions.server";

/**
 * Cockpit에서 사용 — 오너인 사용자에게 RouteOwnerSharePanel을 노출.
 * - 초대 목록 fetch / 캐시
 * - 멤버 검색 시트 (오버레이)
 * - 발급·회수 액션 호출 후 목록 갱신
 */
export function RouteOwnerSharePanelLoader({ grantId }: { grantId: string }) {
  const t = useTranslations("TravelerHub");
  const [invites, setInvites] = useState<ShareInviteSlot[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ user_id: string; display_name: string; avatar_url?: string | null }>
  >([]);
  const [searchPending, startSearch] = useTransition();
  const [actionPending, startAction] = useTransition();

  const refresh = useCallback(() => {
    startAction(async () => {
      const r = await listRouteShareInvitesAction({ grantId });
      if (r.ok) setInvites(r.invites);
    });
  }, [grantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 디바운스 검색 — q가 2자 미만이면 effect 자체를 skip해서 setState 호출 없이 결과를 유지.
  // (사용자가 다시 입력하면 setSearchResults가 한 번에 갱신된다)
  const debouncedQ = searchQ.trim();
  useEffect(() => {
    if (!searchOpen || debouncedQ.length < 2) return;
    const handle = setTimeout(() => {
      startSearch(async () => {
        const r = await searchMembersForInviteAction({ query: debouncedQ });
        if (r.ok) setSearchResults(r.results);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [debouncedQ, searchOpen]);

  function onInviteClick() {
    setSearchQ("");
    setSearchResults([]); // 검색 시트 새로 열 때 이전 결과 초기화 (이벤트 핸들러에서 안전)
    setSearchOpen(true);
  }

  function onPickMember(userId: string) {
    startAction(async () => {
      const r = await createRouteShareInviteAction({ grantId, granteeUserId: userId });
      if (r.ok) {
        setSearchOpen(false);
        refresh();
      }
      // 실패 시 그대로 두고 사용자가 다시 시도(에러 토스트는 후속).
    });
  }

  function onRevoke(inviteId: string) {
    startAction(async () => {
      const r = await revokeRouteShareInviteAction({ inviteId });
      if (r.ok) refresh();
    });
  }

  return (
    <>
      <RouteOwnerSharePanel invites={invites} onInvite={onInviteClick} onRevoke={onRevoke} />

      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] rounded-t-3xl p-0">
          <SheetHeader>
            <SheetTitle>{t("routeOwnerShareInviteCta")}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-5 pb-6">
            <label className="border-border/60 focus-within:border-[var(--brand-primary)] flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
              <Search className="text-muted-foreground size-4" aria-hidden />
              <input
                autoFocus
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t("routeOwnerShareInviteCta")}
                className="flex-1 bg-transparent text-sm outline-none"
              />
              {searchPending ? <Loader2 className="text-muted-foreground size-4 animate-spin" /> : null}
            </label>
            <ul className="space-y-1.5">
              {searchResults.length === 0 && searchQ.trim().length >= 2 && !searchPending ? (
                <li className="text-muted-foreground py-6 text-center text-sm">No matches</li>
              ) : null}
              {searchResults.map((m) => (
                <li key={m.user_id}>
                  <button
                    type="button"
                    onClick={() => onPickMember(m.user_id)}
                    disabled={actionPending}
                    className="hover:bg-muted disabled:opacity-60 flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors"
                  >
                    <span className="bg-muted size-9 shrink-0 overflow-hidden rounded-full">
                      {m.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={m.avatar_url} alt="" className="size-full object-cover" />
                      ) : null}
                    </span>
                    <span className="text-foreground flex-1 truncate text-sm font-semibold">
                      {m.display_name}
                    </span>
                    {actionPending ? (
                      <Loader2 className="text-muted-foreground size-4 animate-spin" />
                    ) : (
                      <UserCheck className="text-muted-foreground size-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
