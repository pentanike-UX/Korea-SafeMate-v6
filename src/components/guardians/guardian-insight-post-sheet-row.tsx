"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ContentPost } from "@/types/domain";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { PostPreviewSheetPanel } from "@/components/posts/post-preview-sheet";
import { postCompactThumbCoverClass } from "@/lib/post-image-crop";
import { cn } from "@/lib/utils";

export function GuardianInsightPostSheetRow({
  post,
  imageUrl,
  fmtLabel,
  regionLabel,
  themeLabel,
  route,
  stopsLabel,
}: {
  post: ContentPost;
  imageUrl: string;
  fmtLabel: string;
  regionLabel: string;
  themeLabel: string;
  route: boolean;
  stopsLabel: string | null;
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

  return (
    <li>
      <Sheet open={open} onOpenChange={setOpen}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "border-border/70 bg-card group flex w-full gap-3 overflow-hidden rounded-2xl border p-3 text-left shadow-[var(--shadow-sm)] transition-colors",
            "hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          )}
        >
          <div className="border-border/50 relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl border bg-muted sm:size-[5.25rem]">
            <Image
              src={imageUrl}
              alt=""
              fill
              className={cn(postCompactThumbCoverClass(post), "transition-transform duration-300 group-hover:scale-[1.03]")}
              sizes="(max-width:640px) 72px, 84px"
            />
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase">
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5">{fmtLabel}</span>
              <span className="text-muted-foreground font-medium normal-case">{regionLabel}</span>
              <span aria-hidden className="text-muted-foreground/60">
                ·
              </span>
              <span className="text-muted-foreground font-medium normal-case">{themeLabel}</span>
              {route && stopsLabel ? (
                <>
                  <span aria-hidden className="text-muted-foreground/60">
                    ·
                  </span>
                  <span className="text-muted-foreground font-medium normal-case">{stopsLabel}</span>
                </>
              ) : null}
            </div>
            <p className="text-foreground mt-1 line-clamp-2 text-sm font-semibold leading-snug">{post.title}</p>
            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed sm:text-[13px]">{post.summary}</p>
          </div>
        </button>
        <SheetContent side={side} className={side === "right" ? "sm:max-w-md" : "max-h-[86vh] rounded-t-2xl"}>
          <PostPreviewSheetPanel post={post} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </li>
  );
}
