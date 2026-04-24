import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  /** Optional note under the main description (e.g. bilingual / moderation stance). */
  note?: string;
  children?: ReactNode;
};

export function ExploreHero({ eyebrow, title, description, note, children }: Props) {
  return (
    <section className="relative overflow-hidden border-b bg-hero-mesh-subtle">
      <div className="page-container relative py-14 sm:py-16 md:py-20">
        {eyebrow ? (
          <p className="text-[var(--brand-trust-blue)] text-xs font-semibold tracking-widest uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="text-text-strong mt-3 max-w-3xl text-[1.65rem] font-semibold leading-tight tracking-tight sm:text-4xl md:text-[2.25rem]">
          {title}
        </h1>
        <p className="text-muted-foreground mt-5 max-w-2xl text-[15px] leading-relaxed sm:mt-6 sm:text-base">
          {description}
        </p>
        {note ? (
          <p className="text-muted-foreground mt-4 max-w-xl text-xs leading-relaxed sm:text-sm">{note}</p>
        ) : null}
        {children ? <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">{children}</div> : null}
      </div>
    </section>
  );
}
