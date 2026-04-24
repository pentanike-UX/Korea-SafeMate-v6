"use client";

import type { GuardianReview, TravelerReview } from "@/types/domain";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type TravelerReviewRow = TravelerReview & {
  traveler_label: string;
  guardian_label: string;
};

export type GuardianReviewRow = GuardianReview & {
  traveler_label: string;
  guardian_label: string;
};

type Props = {
  travelerRows: TravelerReviewRow[];
  guardianRows: GuardianReviewRow[];
};

function RatingCell({ rating }: { rating: number }) {
  return (
    <span className="text-foreground text-sm font-semibold tabular-nums">
      {rating}
      <span className="text-muted-foreground font-normal">/5</span>
    </span>
  );
}

export function AdminReviewsPanel({ travelerRows, guardianRows }: Props) {
  return (
    <Tabs defaultValue="traveler_to_guardian" className="w-full">
      <TabsList className="bg-muted/50 text-muted-foreground inline-flex h-10 w-full max-w-lg items-center gap-1 rounded-lg border p-1 md:w-auto">
        <TabsTrigger
          value="traveler_to_guardian"
          className="data-[state=active]:bg-background rounded-md px-4 py-1.5 text-xs font-semibold tracking-wide uppercase data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          Traveler → Guardian
        </TabsTrigger>
        <TabsTrigger
          value="guardian_to_traveler"
          className="data-[state=active]:bg-background rounded-md px-4 py-1.5 text-xs font-semibold tracking-wide uppercase data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          Guardian → Traveler
        </TabsTrigger>
      </TabsList>

      <TabsContent value="traveler_to_guardian" className="mt-6 space-y-3">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Shapes public-facing reputation and long-term matching quality — processed under trust program rules,
          not booking tickets.
        </p>
        <div className="border-border/80 overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  Traveler
                </TableHead>
                <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  Guardian
                </TableHead>
                <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  Rating
                </TableHead>
                <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  Date
                </TableHead>
                <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  Comment
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {travelerRows.map((r) => (
                <TableRow key={r.id} className="border-border/50">
                  <TableCell className="text-foreground px-4 py-3 text-sm font-medium">{r.traveler_label}</TableCell>
                  <TableCell className="text-muted-foreground px-4 py-3 text-sm">{r.guardian_label}</TableCell>
                  <TableCell className="px-4 py-3">
                    <RatingCell rating={r.rating} />
                  </TableCell>
                  <TableCell className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-md px-4 py-3 text-sm leading-relaxed">
                    {r.comment ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="guardian_to_traveler" className="mt-6 space-y-3">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Mutual layer for behavior quality — restricted visibility; used with incidents and matching policy.
        </p>
        <div className="border-border/80 overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  Guardian
                </TableHead>
                <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  Traveler
                </TableHead>
                <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  Rating
                </TableHead>
                <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  Date
                </TableHead>
                <TableHead className="text-muted-foreground h-11 px-4 text-[11px] font-semibold tracking-wide uppercase">
                  Comment
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guardianRows.map((r) => (
                <TableRow key={r.id} className="border-border/50">
                  <TableCell className="text-foreground px-4 py-3 text-sm font-medium">{r.guardian_label}</TableCell>
                  <TableCell className="text-muted-foreground px-4 py-3 text-sm">{r.traveler_label}</TableCell>
                  <TableCell className="px-4 py-3">
                    <RatingCell rating={r.rating} />
                  </TableCell>
                  <TableCell className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-md px-4 py-3 text-sm leading-relaxed">
                    {r.comment ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
