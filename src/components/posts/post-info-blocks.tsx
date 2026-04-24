import type { ReactNode } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Lightbulb,
  ListChecks,
  MapPinned,
  Quote,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { POST_DETAIL_PARAGRAPH_STACK, POST_DETAIL_PROSE_P_MAIN, splitPostBodyParagraphs } from "@/lib/post-detail-body-split";

const labelStrong = "text-[10px] font-bold tracking-[0.2em] uppercase";
const labelAction = "text-[10px] font-bold tracking-[0.18em] uppercase text-primary";

/** A — context / who this is for */
export function PostInfoContextCard({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border/50 rounded-2xl border bg-gradient-to-br from-muted/40 to-muted/15 px-4 py-4 shadow-[var(--shadow-sm)] sm:px-5 sm:py-5",
        className,
      )}
    >
      <div className="text-primary flex items-center gap-2">
        <MapPinned className="size-4 shrink-0 opacity-80" aria-hidden />
        <span className={labelStrong}>{label}</span>
      </div>
      <div className="text-foreground mt-3 text-[15px] leading-relaxed sm:text-base">{children}</div>
    </div>
  );
}

/** B — strongest summary / conclusion */
export function PostInfoKeyNote({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-primary/40 rounded-2xl border-2 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent px-4 py-4 shadow-[var(--shadow-md)] sm:px-6 sm:py-5",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="text-primary size-4 shrink-0" aria-hidden />
        <span className="text-primary text-[11px] font-bold tracking-wide">{label}</span>
      </div>
      <div className="text-text-strong mt-3 text-base font-semibold leading-relaxed sm:text-lg">{children}</div>
    </div>
  );
}

/** C — numbered tip cards */
export function PostInfoTipCards({
  label,
  tips,
  className,
}: {
  label: string;
  tips: string[];
  className?: string;
}) {
  if (tips.length === 0) return null;
  return (
    <section className={cn("space-y-3", className)} aria-label={label}>
      <div className="flex items-center gap-2">
        <Lightbulb className="text-primary size-4 shrink-0" aria-hidden />
        <h3 className="text-text-strong text-sm font-bold tracking-wide">{label}</h3>
      </div>
      <ul className="grid list-none gap-3 p-0 sm:gap-4">
        {tips.map((tip, i) => {
          const paras = splitPostBodyParagraphs(tip);
          const [head, ...rest] = paras;
          return (
            <li
              key={i}
              className="border-border/60 bg-card relative overflow-hidden rounded-2xl border shadow-[var(--shadow-sm)]"
            >
              <div className="bg-primary/10 text-primary absolute top-0 left-0 flex size-9 items-center justify-center rounded-br-xl text-sm font-bold">
                {i + 1}
              </div>
              <div className="pl-4 pt-11 pr-4 pb-4 sm:pl-5 sm:pt-12 sm:pr-5 sm:pb-5">
                {head ? <p className="text-foreground text-[15px] font-semibold leading-snug sm:text-base">{head}</p> : null}
                {rest.length > 0 ? (
                  <div className={cn(POST_DETAIL_PARAGRAPH_STACK, "mt-2")}>
                    {rest.map((p, j) => (
                      <p key={j} className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line sm:text-[15px]">
                        {p}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** D — checklist */
export function PostInfoChecklist({
  label,
  items,
  className,
}: {
  label: string;
  items: string[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section
      className={cn("border-border/60 rounded-2xl border bg-white/90 px-4 py-4 shadow-[var(--shadow-sm)] sm:px-5 sm:py-5", className)}
      aria-label={label}
    >
      <div className="text-muted-foreground flex items-center gap-2">
        <ListChecks className="size-4 shrink-0" aria-hidden />
        <span className={labelStrong}>{label}</span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed sm:text-[15px]">
            <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="text-foreground min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** E — action / field tips */
export function PostInfoActionNote({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-primary/25 rounded-2xl border bg-gradient-to-r from-primary/8 to-transparent px-4 py-4 sm:px-5 sm:py-4",
        className,
      )}
    >
      <div className={cn("flex items-center gap-2", labelAction)}>
        <Zap className="size-4 shrink-0" aria-hidden />
        <span>{label}</span>
      </div>
      <div className="text-foreground mt-2.5 text-sm leading-relaxed whitespace-pre-line sm:text-[15px]">{children}</div>
    </div>
  );
}

/** F — mistakes / caution */
export function PostInfoWarningNote({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/10 to-amber-500/[0.03] px-4 py-4 dark:border-amber-400/30 sm:px-5 sm:py-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{label}</span>
      </div>
      <div className="text-foreground mt-2.5 text-sm leading-relaxed whitespace-pre-line sm:text-[15px]">{children}</div>
    </div>
  );
}

/** G — closing summary panel */
export function PostInfoSummaryPanel({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border/60 rounded-2xl border bg-muted/25 px-4 py-4 shadow-inner sm:px-6 sm:py-5",
        className,
      )}
    >
      <div className="text-muted-foreground flex items-center gap-2">
        <ClipboardList className="size-4 shrink-0 opacity-80" aria-hidden />
        <span className={labelStrong}>{label}</span>
      </div>
      <div className="text-foreground mt-3 text-[15px] font-medium leading-relaxed sm:text-base">{children}</div>
    </div>
  );
}

/** H — guardian voice */
export function GuardianSignatureQuote({
  label,
  badge,
  children,
  className,
}: {
  label: string;
  badge?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "border-primary/20 relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/6 to-transparent px-5 py-5 sm:px-7 sm:py-6",
        className,
      )}
    >
      <Quote className="text-primary/25 pointer-events-none absolute top-3 right-4 size-10 sm:size-12" aria-hidden />
      <figcaption className="text-primary mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase">
        {badge ? <span className="bg-primary/15 rounded-full px-2 py-0.5">{badge}</span> : null}
        {label}
      </figcaption>
      <blockquote className="text-text-strong relative text-[15px] leading-relaxed font-medium italic sm:text-base">
        {children}
      </blockquote>
    </figure>
  );
}

/** Route: route summary chip row style */
export function PostInfoRouteSummaryStrip({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-primary/30 rounded-2xl border bg-primary/5 px-4 py-3 sm:px-5", className)}>
      <p className="text-primary text-[10px] font-bold tracking-widest uppercase">{label}</p>
      <p className="text-text-strong mt-1.5 text-sm font-semibold leading-relaxed sm:text-base">{children}</p>
    </div>
  );
}

export function PostInfoRouteBeforeNote({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-border/60 rounded-2xl border bg-card/90 px-4 py-4 sm:px-5", className)}>
      <p className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">{label}</p>
      <div className="text-foreground mt-2 text-sm leading-relaxed whitespace-pre-line sm:text-[15px]">{children}</div>
    </div>
  );
}

export function PostInfoRouteClosingPanel({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-border/50 rounded-2xl border border-dashed bg-muted/20 px-4 py-4 sm:px-5", className)}>
      <p className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">{label}</p>
      <div className="text-foreground mt-2 text-[15px] leading-relaxed sm:text-base">{children}</div>
    </div>
  );
}

export function PostInfoNarrativeStack({ text, className }: { text: string; className?: string }) {
  const paras = splitPostBodyParagraphs(text);
  if (paras.length === 0) return null;
  return (
    <div className={cn(POST_DETAIL_PARAGRAPH_STACK, className)}>
      {paras.map((p, i) => (
        <p key={i} className={POST_DETAIL_PROSE_P_MAIN}>
          {p}
        </p>
      ))}
    </div>
  );
}

/** Spot — 추천 이유 */
export function RouteSpotReasonBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-primary/35 rounded-2xl border bg-gradient-to-br from-primary/12 to-primary/[0.04] px-4 py-3.5 shadow-sm sm:px-5 sm:py-4",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="text-primary size-4 shrink-0" aria-hidden />
        <span className="text-primary text-xs font-bold">{label}</span>
      </div>
      <div className="text-foreground mt-2 text-sm leading-relaxed sm:text-[15px]">{children}</div>
    </div>
  );
}

/** Spot — 포토 팁 */
export function RouteSpotPhotoTipNote({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-sky-500/25 bg-sky-500/[0.06] px-4 py-3.5 dark:bg-sky-500/10 sm:px-5", className)}>
      <div className="flex items-center gap-2 text-sky-900 dark:text-sky-100">
        <Camera className="size-4 shrink-0 opacity-90" aria-hidden />
        <span className="text-[10px] font-bold tracking-wide uppercase">{label}</span>
      </div>
      <div className="text-foreground mt-2 text-sm leading-relaxed sm:text-[15px]">{children}</div>
    </div>
  );
}

/** Spot — 주의 */
export function RouteSpotWarningNote({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-500/40 bg-amber-500/[0.08] px-4 py-3.5 dark:border-amber-400/35 sm:px-5",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        <span className="text-[10px] font-bold tracking-wide uppercase">{label}</span>
      </div>
      <div className="text-foreground mt-2 text-sm leading-relaxed sm:text-[15px]">{children}</div>
    </div>
  );
}

/** Spot — 머무름 메타 (pass translated string as children, e.g. stayDuration) */
export function RouteSpotMetaStayRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 text-xs sm:text-sm",
        className,
      )}
    >
      <Clock className="text-primary size-4 shrink-0 opacity-80" aria-hidden />
      <span className="text-foreground font-medium">{children}</span>
    </div>
  );
}

/** Spot — 다음 장소 연결 (`label` = i18n 톤, 본문은 데이터에서 헤더 줄 제거 후 표시) */
export function RouteSpotNextFlowRow({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const body = text.replace(/^다음 장소로 이어지는 포인트\s*\n?/, "").trim();
  return (
    <div
      className={cn(
        "border-primary/20 flex gap-3 rounded-2xl border bg-gradient-to-r from-primary/5 to-transparent px-4 py-3.5 sm:px-5",
        className,
      )}
    >
      <ChevronRight className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-primary text-[10px] font-bold tracking-wide uppercase">{label}</p>
        {body ? (
          <p className="text-foreground mt-1 text-sm leading-relaxed whitespace-pre-line">{body}</p>
        ) : null}
      </div>
    </div>
  );
}
