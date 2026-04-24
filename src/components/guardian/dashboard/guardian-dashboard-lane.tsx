import { cn } from "@/lib/utils";

type OpsSystem = "content" | "trust" | "bookings";

const ACCENT: Record<OpsSystem, string> = {
  content: "border-l-[var(--success)]",
  trust: "border-l-[var(--brand-trust-blue)]",
  bookings: "border-l-[var(--accent-purple-blue)]",
};

export function GuardianDashboardLane({
  system,
  title,
  description,
  children,
  className,
}: {
  system: OpsSystem;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border-border/80 from-card/90 to-[var(--brand-primary-soft)]/15 rounded-2xl border border-l-4 bg-gradient-to-br shadow-[var(--shadow-sm)] backdrop-blur-[2px]",
        ACCENT[system],
        className,
      )}
    >
      <div className="border-border/60 border-b px-4 py-4 sm:px-5">
        <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
          Admin-controlled system
        </p>
        <h2 className="text-foreground mt-1 text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-relaxed">{description}</p>
      </div>
      <div className="space-y-6 p-4 sm:p-5">{children}</div>
    </section>
  );
}
