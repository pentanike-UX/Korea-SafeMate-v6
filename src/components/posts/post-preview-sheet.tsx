"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getPostHeroImageUrl } from "@/lib/content-post-route";
import { postCompactThumbCoverClass, postHeroCoverClass } from "@/lib/post-image-crop";
import type { ContentPost } from "@/types/domain";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { listCardActionButtonClass } from "@/components/ui/action-variants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function PostPreviewSheetPanel({
  post,
  onNavigate,
}: {
  post: ContentPost;
  onNavigate?: () => void;
}) {
  const t = useTranslations("TravelerHub");
  return (
    <>
      <SheetHeader>
        <SheetTitle>{post.title}</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="border-border/60 relative aspect-[16/9] overflow-hidden rounded-xl border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getPostHeroImageUrl(post)}
            alt=""
            className={cn("size-full", postHeroCoverClass(post))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{post.region_slug}</Badge>
          <Badge variant="outline">{post.category_slug}</Badge>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{post.summary}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild className={cn(listCardActionButtonClass, "px-4")}>
            <Link href={`/posts/${post.id}`} onClick={onNavigate}>
              {t("readPost")}
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}

/** Small button that opens a post preview sheet; full post page only via in-sheet CTA. */
/**
 * Card-shaped control: opens preview sheet; full post only from panel CTA.
 */
export function PostPreviewSheetCardRoute({
  post,
  badgeLabel,
}: {
  post: ContentPost;
  badgeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"right" | "bottom">("bottom");
  const cover = getPostHeroImageUrl(post);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSide(mq.matches ? "right" : "bottom");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border/70 bg-card group flex w-full overflow-hidden rounded-2xl border text-left shadow-[var(--shadow-sm)] transition-all hover:border-primary/30 hover:shadow-[var(--shadow-md)]"
      >
        <div className="relative aspect-square w-[6.25rem] max-[360px]:w-24 shrink-0 overflow-hidden bg-muted sm:w-32">
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              className={cn(postCompactThumbCoverClass(post), "transition-transform duration-500 group-hover:scale-[1.03]")}
              sizes="128px"
            />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
          <Badge variant="outline" className="mb-1 w-fit rounded-full text-[10px]">
            {badgeLabel}
          </Badge>
          <p className="text-foreground line-clamp-2 text-sm font-semibold leading-snug">{post.title}</p>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{post.summary}</p>
        </div>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={side} className={side === "right" ? "sm:max-w-md" : "max-h-[86vh] rounded-t-2xl"}>
          <PostPreviewSheetPanel post={post} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function PostPreviewSheetCardArticle({ post }: { post: ContentPost }) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"right" | "bottom">("bottom");
  const cover = getPostHeroImageUrl(post);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSide(mq.matches ? "right" : "bottom");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border/70 bg-card group w-full overflow-hidden rounded-2xl border text-left shadow-[var(--shadow-sm)] transition-all hover:border-primary/30"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              className={cn(postHeroCoverClass(post), "transition-transform duration-500 group-hover:scale-[1.02]")}
              sizes="(max-width:768px) 100vw, 50vw"
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <div className="p-4">
          <p className="text-foreground line-clamp-2 text-sm font-semibold leading-snug">{post.title}</p>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{post.summary}</p>
        </div>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={side} className={side === "right" ? "sm:max-w-md" : "max-h-[86vh] rounded-t-2xl"}>
          <PostPreviewSheetPanel post={post} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function PostPreviewSheetButton({
  post,
  triggerLabel,
  triggerVariant = "outline",
  className,
  size = "sm",
}: {
  post: ContentPost;
  triggerLabel: string;
  triggerVariant?: "outline" | "ghost" | "default";
  className?: string;
  size?: "default" | "sm" | "lg";
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
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size={size}
        variant={triggerVariant}
        className={cn("rounded-xl font-semibold", className)}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      <SheetContent side={side} className={side === "right" ? "sm:max-w-md" : "max-h-[86vh] rounded-t-2xl"}>
        <PostPreviewSheetPanel post={post} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
