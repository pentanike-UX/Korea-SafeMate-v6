"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ContentPost, ContentPostStatus } from "@/types/domain";
import { regionDisplayLabelFromSlug } from "@/lib/mypage/region-label-i18n";
import { ContentStatusBadge } from "@/components/admin/content-status-badge";
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

export function AdminContentTable({ posts }: { posts: ContentPost[] }) {
  const tRegion = useTranslations("TravelerHub");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ContentPostStatus | "all">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!needle) return true;
      return (
        p.title.toLowerCase().includes(needle) ||
        p.author_display_name.toLowerCase().includes(needle) ||
        p.id.toLowerCase().includes(needle)
      );
    });
  }, [posts, q, status]);

  return (
    <div className="space-y-4">
      <AdminFilterBar>
        <AdminFilterField label="Search" className="min-w-[200px] flex-[2]">
          <AdminSearchInput value={q} onChange={setQ} placeholder="Title, author, post id…" />
        </AdminFilterField>
        <AdminFilterField label="Status" className="min-w-[150px]">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ContentPostStatus | "all")}
            className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </AdminFilterField>
        <p className="text-muted-foreground flex items-center text-xs sm:ml-auto">
          {filtered.length} of {posts.length}
        </p>
      </AdminFilterBar>

      <div className="border-border/80 overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Title
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Region
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Author
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Hero focus
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                Status
              </TableHead>
              <TableHead className="text-muted-foreground h-11 px-4 text-right text-[11px] font-semibold tracking-wide uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} className="border-border/50">
                <TableCell className="text-foreground max-w-md px-4 py-3 text-sm font-medium leading-snug">
                  {p.title}
                </TableCell>
                <TableCell className="text-muted-foreground px-4 py-3 text-sm whitespace-nowrap">
                  {regionDisplayLabelFromSlug(p.region_slug, (k) => tRegion(k))}
                </TableCell>
                <TableCell className="text-muted-foreground px-4 py-3 text-sm">{p.author_display_name}</TableCell>
                <TableCell className="text-muted-foreground px-4 py-3 text-sm whitespace-nowrap">
                  {p.hero_subject === "person"
                    ? "인물 중심"
                    : p.hero_subject === "place"
                      ? "장소 중심"
                      : p.hero_subject === "mixed"
                        ? "혼합형"
                        : "—"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <ContentStatusBadge status={p.status} />
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" disabled>
                    Moderate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button asChild variant="link" className="text-muted-foreground h-auto px-0 text-xs">
        <Link href="/explore">Open public Explore →</Link>
      </Button>
    </div>
  );
}
