"use client";

import { cn } from "@/lib/utils";

/** Sticks below the site header (`site-header`: h-14 / sm:h-16, z-50). */
export function StickyListingFiltersBar({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-14 z-40 border-b border-border/70 bg-background/95 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-background/88 sm:top-16",
        className,
      )}
    >
      <div className={cn("page-container py-3 sm:py-3.5", innerClassName)}>{children}</div>
    </div>
  );
}
