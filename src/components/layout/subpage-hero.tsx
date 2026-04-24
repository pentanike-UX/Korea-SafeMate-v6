"use client";

import { cn } from "@/lib/utils";

export function SubpageHero({
  title,
  description,
  eyebrow,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden border-b border-border/60 bg-card/80", className)}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-[8%] h-52 w-52 rounded-full bg-[var(--brand-trust-blue)]/12 blur-3xl" />
        <div className="absolute top-8 right-[12%] h-44 w-44 rounded-full bg-[var(--brand-primary)]/8 blur-3xl" />
      </div>
      <div className="page-container relative py-11 text-center sm:py-13 md:py-14">
        {eyebrow ? <div className="mb-3 flex justify-center">{eyebrow}</div> : null}
        <h1 className="text-text-strong mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed sm:text-base">{description}</p>
        ) : null}
      </div>
    </section>
  );
}
