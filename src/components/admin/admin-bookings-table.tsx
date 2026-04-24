"use client";

import { useMemo, useState } from "react";
import type { BookingStatus, BookingWithDetails } from "@/types/domain";
import { CONTACT_CHANNEL_LABELS } from "@/lib/constants";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { AdminFilterBar, AdminFilterField, AdminSearchInput } from "@/components/admin/admin-filter-bar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ALL_STATUSES: (BookingStatus | "all")[] = [
  "all",
  "requested",
  "reviewing",
  "matched",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "issue_reported",
];

export function AdminBookingsTable({ bookings }: { bookings: BookingWithDetails[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return bookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (!needle) return true;
      return (
        b.id.toLowerCase().includes(needle) ||
        b.traveler_name.toLowerCase().includes(needle) ||
        (b.guardian_name?.toLowerCase().includes(needle) ?? false) ||
        b.service_name.toLowerCase().includes(needle)
      );
    });
  }, [bookings, q, status]);

  return (
    <div className="space-y-4">
      <AdminFilterBar>
        <AdminFilterField label="Search" className="min-w-[200px] flex-[2]">
          <AdminSearchInput value={q} onChange={setQ} placeholder="ID, traveler, guardian, service…" />
        </AdminFilterField>
        <AdminFilterField label="Status" className="min-w-[160px]">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BookingStatus | "all")}
            className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st === "all" ? "All statuses" : st.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </AdminFilterField>
        <p className="text-muted-foreground flex items-center text-xs sm:ml-auto">
          {filtered.length} of {bookings.length} rows
        </p>
      </AdminFilterBar>

      <div className="border-border/80 overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                ID
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Traveler
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Guardian
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Service
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Start
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Status
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Handoff
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-right text-[11px] font-semibold tracking-wide uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id} className="border-border/50">
                <TableCell className="text-muted-foreground px-4 py-3 font-mono text-xs">{b.id}</TableCell>
                <TableCell className="text-foreground px-4 py-3 text-sm font-medium">{b.traveler_name}</TableCell>
                <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                  {b.guardian_name ?? "—"}
                </TableCell>
                <TableCell className="text-foreground px-4 py-3 text-sm">{b.service_name}</TableCell>
                <TableCell className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                  {new Date(b.requested_start).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <BookingStatusBadge status={b.status} size="compact" />
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[180px] px-4 py-3 text-xs leading-snug">
                  {b.preferred_contact_channel
                    ? `${CONTACT_CHANNEL_LABELS[b.preferred_contact_channel]}${b.contact_handle_hint ? ` · ${b.contact_handle_hint}` : ""}`
                    : "—"}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" disabled>
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
