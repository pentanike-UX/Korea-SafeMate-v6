"use client";

import { useState, useTransition } from "react";
import type { AdminGrantRow, AdminInviteRow, AdminPackRow } from "@/lib/route-access-admin.server";
import {
  adminExpireGrantAction,
  adminIssueCompGrantAction,
  adminRevokeInviteAction,
} from "@/app/admin/route-passes/actions";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

function daysFromNow(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function AdminRoutePassesClient({
  grants,
  invites,
  packs,
}: {
  grants: AdminGrantRow[];
  invites: AdminInviteRow[];
  packs: AdminPackRow[];
}) {
  const [pending, start] = useTransition();
  const [compRouteId, setCompRouteId] = useState("");
  const [compOwnerId, setCompOwnerId] = useState("");
  const [compDays, setCompDays] = useState("90");
  const [feedback, setFeedback] = useState<string | null>(null);

  function notify(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  }

  function onExpire(grantId: string) {
    if (!confirm("Force-expire this grant?")) return;
    start(async () => {
      const r = await adminExpireGrantAction({ grantId });
      notify(r.ok ? "Expired." : `Failed: ${r.error}`);
    });
  }

  function onRevoke(inviteId: string) {
    if (!confirm("Revoke this invite?")) return;
    start(async () => {
      const r = await adminRevokeInviteAction({ inviteId });
      notify(r.ok ? "Revoked." : `Failed: ${r.error}`);
    });
  }

  function onIssueComp(e: React.FormEvent) {
    e.preventDefault();
    if (!compRouteId.trim() || !compOwnerId.trim()) {
      notify("routeId and ownerUserId required");
      return;
    }
    start(async () => {
      const r = await adminIssueCompGrantAction({
        routeId: compRouteId.trim(),
        ownerUserId: compOwnerId.trim(),
        validDays: Number(compDays) || 90,
      });
      if (r.ok) {
        notify(`Comp grant ${r.grantId.slice(0, 8)}…`);
        setCompRouteId("");
        setCompOwnerId("");
        setCompDays("90");
      } else {
        notify(`Failed: ${r.error}`);
      }
    });
  }

  return (
    <div className="space-y-10">
      {feedback ? (
        <div className="rounded-xl border border-amber-400/40 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {feedback}
        </div>
      ) : null}

      {/* Comp grant form */}
      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="text-sm font-bold text-foreground">Issue comp grant</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Owner gets unlimited views for N days. Used for CS, marketing, or comp.
        </p>
        <form onSubmit={onIssueComp} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">Route ID</span>
            <input
              value={compRouteId}
              onChange={(e) => setCompRouteId(e.target.value)}
              placeholder="uuid or mock id"
              className="w-72 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm font-mono"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">Owner user ID</span>
            <input
              value={compOwnerId}
              onChange={(e) => setCompOwnerId(e.target.value)}
              placeholder="auth.users.id (uuid)"
              className="w-72 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm font-mono"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">Days</span>
            <input
              value={compDays}
              onChange={(e) => setCompDays(e.target.value)}
              type="number"
              min={1}
              max={365}
              className="w-24 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm tabular-nums"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-bold text-[var(--text-on-brand)] hover:opacity-95 disabled:opacity-60"
          >
            Issue
          </button>
        </form>
      </section>

      {/* Grants table */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-foreground">
          Grants ({grants.length})
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2">Route</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Expires</th>
                <th className="px-3 py-2 text-right">Invites</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {grants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    No grants yet.
                  </td>
                </tr>
              ) : (
                grants.map((g) => {
                  const days = daysFromNow(g.expires_at);
                  const expired = days <= 0;
                  return (
                    <tr key={g.grant_id} className="border-t border-border/40 align-top">
                      <td className="px-3 py-2 font-mono">{g.route_id.slice(0, 14)}…</td>
                      <td className="px-3 py-2">
                        <p className="font-semibold">{g.owner_display_name}</p>
                        <p className="text-muted-foreground font-mono text-[10px]">
                          {g.owner_user_id.slice(0, 8)}…
                        </p>
                      </td>
                      <td className="px-3 py-2">{g.source}</td>
                      <td className="px-3 py-2">
                        <p className={expired ? "text-rose-500 font-semibold" : ""}>
                          {formatDate(g.expires_at)}
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          {expired ? "expired" : `${days}d left`}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{g.active_invite_count}/2</td>
                      <td className="px-3 py-2 text-right">
                        {!expired ? (
                          <button
                            type="button"
                            onClick={() => onExpire(g.grant_id)}
                            disabled={pending}
                            className="rounded-lg border border-rose-500/40 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-500/10 disabled:opacity-60 dark:text-rose-400"
                          >
                            Expire
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invites table */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-foreground">
          Recent share invites ({invites.length})
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2">Route</th>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    No invites yet.
                  </td>
                </tr>
              ) : (
                invites.map((i) => (
                  <tr key={i.invite_id} className="border-t border-border/40 align-top">
                    <td className="px-3 py-2 font-mono">{i.route_id.slice(0, 14)}…</td>
                    <td className="px-3 py-2">{i.granted_by_display_name}</td>
                    <td className="px-3 py-2">{i.granted_to_display_name}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          i.status === "active"
                            ? "rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "rounded-full bg-muted px-2 py-0.5 text-muted-foreground"
                        }
                      >
                        {i.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">{formatDate(i.created_at)}</td>
                    <td className="px-3 py-2 text-right">
                      {i.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => onRevoke(i.invite_id)}
                          disabled={pending}
                          className="rounded-lg border border-rose-500/40 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-500/10 disabled:opacity-60 dark:text-rose-400"
                        >
                          Revoke
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Packs table */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-foreground">Ticket packs ({packs.length})</h2>
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Pack</th>
                <th className="px-3 py-2">Used</th>
                <th className="px-3 py-2">Expires</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {packs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    No packs yet.
                  </td>
                </tr>
              ) : (
                packs.map((p) => (
                  <tr key={p.pack_id} className="border-t border-border/40">
                    <td className="px-3 py-2">
                      <p className="font-semibold">{p.owner_display_name}</p>
                      <p className="text-muted-foreground font-mono text-[10px]">
                        {p.owner_user_id.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="px-3 py-2">{p.pack_size}-pack</td>
                    <td className="px-3 py-2 tabular-nums">
                      {p.tickets_used}/{p.pack_size}
                    </td>
                    <td className="px-3 py-2">{formatDate(p.expires_at)}</td>
                    <td className="px-3 py-2">{formatDate(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
