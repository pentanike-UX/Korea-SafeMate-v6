"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentPost } from "@/types/domain";
import { sheetRelatedPostThumbCoverClass } from "@/lib/post-image-crop";

export type RelatedPostSheetItem = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  /** 없으면 시트 썸네일은 `FILL_IMAGE_POST_THUMB_SQUARE` 계열 혼합 기본 */
  kind?: ContentPost["kind"];
  hero_subject?: ContentPost["hero_subject"] | null;
};

export function RelatedPostsBrowseSheet({
  items,
  sheetTitle,
  triggerLabel,
}: {
  items: RelatedPostSheetItem[];
  sheetTitle: string;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"right" | "bottom">("bottom");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSide(mq.matches ? "right" : "bottom");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (items.length === 0) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        className="rounded-xl font-semibold"
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      <SheetContent
        side={side}
        className={cn(
          "flex w-full flex-col gap-0 overflow-hidden p-0",
          side === "right" ? "sm:max-w-md" : "max-h-[88vh] rounded-t-2xl",
        )}
      >
        <SheetHeader className="border-border/60 shrink-0 border-b px-5 py-4 text-left sm:px-6">
          <SheetTitle className="text-base leading-snug sm:text-lg">{sheetTitle}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
          <ul className="space-y-2.5 pb-4">
            {items.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/posts/${p.id}`}
                  scroll
                  onClick={() => setOpen(false)}
                  className="border-border/70 bg-card group flex gap-3 overflow-hidden rounded-xl border p-2.5 shadow-[var(--shadow-sm)] transition-colors hover:border-primary/30"
                >
                  <div className="border-border/50 relative size-[4.25rem] shrink-0 overflow-hidden rounded-lg border bg-muted sm:size-[4.75rem]">
                    <Image
                      src={p.imageUrl}
                      alt=""
                      fill
                      className={cn(
                        sheetRelatedPostThumbCoverClass({ kind: p.kind, hero_subject: p.hero_subject }),
                        "transition-transform duration-300 group-hover:scale-[1.03]",
                      )}
                      sizes="76px"
                    />
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="text-foreground line-clamp-2 text-sm font-semibold leading-snug">{p.title}</p>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">{p.summary}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
