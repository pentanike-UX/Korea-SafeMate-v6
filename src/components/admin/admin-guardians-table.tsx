"use client";

import { useMemo, useState } from "react";
import type { GuardianProfile, GuardianTier } from "@/types/domain";
import { guardianApprovalLabel, guardianApprovalVariant } from "@/lib/booking-ui";
import { GUARDIAN_TIER_ROLE_BADGE_CLASSNAME, guardianTierBadgeVariant, guardianTierLabel } from "@/lib/guardian-tier-ui";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AdminFilterBar, AdminFilterField, AdminSearchInput } from "@/components/admin/admin-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TIERS: (GuardianTier | "all")[] = ["all", "contributor", "active_guardian", "verified_guardian"];
const MATCH: ("all" | "on" | "off")[] = ["all", "on", "off"];

export function AdminGuardiansTable({ guardians }: { guardians: GuardianProfile[] }) {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<GuardianTier | "all">("all");
  const [matching, setMatching] = useState<"all" | "on" | "off">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return guardians.filter((g) => {
      if (tier !== "all" && g.guardian_tier !== tier) return false;
      if (matching === "on" && !g.matching_enabled) return false;
      if (matching === "off" && g.matching_enabled) return false;
      if (!needle) return true;
      return (
        g.display_name.toLowerCase().includes(needle) ||
        g.headline.toLowerCase().includes(needle) ||
        g.user_id.toLowerCase().includes(needle)
      );
    });
  }, [guardians, q, tier, matching]);

  return (
    <div className="space-y-4">
      <AdminFilterBar>
        <AdminFilterField label="Search" className="min-w-[200px] flex-[2]">
          <AdminSearchInput value={q} onChange={setQ} placeholder="Name, headline, user id…" />
        </AdminFilterField>
        <AdminFilterField label="Tier" className="min-w-[150px]">
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as GuardianTier | "all")}
            className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All tiers" : guardianTierLabel(t)}
              </option>
            ))}
          </select>
        </AdminFilterField>
        <AdminFilterField label="Matching" className="min-w-[130px]">
          <select
            value={matching}
            onChange={(e) => setMatching(e.target.value as "all" | "on" | "off")}
            className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="all">All</option>
            <option value="on">Enabled</option>
            <option value="off">Disabled</option>
          </select>
        </AdminFilterField>
        <p className="text-muted-foreground flex items-center text-xs sm:ml-auto">
          {filtered.length} of {guardians.length}
        </p>
      </AdminFilterBar>

      <div className="border-border/80 overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Guardian
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Tier
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                30d / 7d
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Matching
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Approval
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-right text-[11px] font-semibold tracking-wide uppercase">
                Media / Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((g) => (
              <TableRow key={g.user_id} className="border-border/50">
                <TableCell className="px-4 py-3">
                  <div className="font-medium">{g.display_name}</div>
                  <div className="text-muted-foreground mt-0.5 max-w-xs text-xs leading-snug">{g.headline}</div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant={guardianTierBadgeVariant(g.guardian_tier)} className={cn(GUARDIAN_TIER_ROLE_BADGE_CLASSNAME)}>
                    {guardianTierLabel(g.guardian_tier)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground px-4 py-3 text-sm tabular-nums">
                  {g.posts_approved_last_30d} / {g.posts_approved_last_7d}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {g.matching_enabled ? (
                    <span className="border-primary/25 bg-primary/10 text-primary inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
                      On
                    </span>
                  ) : (
                    <span className="border-border text-muted-foreground inline-flex rounded-md border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
                      Off
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant={guardianApprovalVariant(g.approval_status)} className="text-[11px] font-semibold">
                    {guardianApprovalLabel(g.approval_status)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="secondary" className="h-8 rounded-lg text-xs" asChild>
                      <Link href={`/admin/guardians/${g.user_id}/media`}>Media</Link>
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" disabled>
                      Review
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
