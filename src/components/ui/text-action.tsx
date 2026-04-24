"use client";

import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const primaryBase =
  "group/text-act text-[var(--link-color)] hover:text-[var(--link-hover)] -mx-1 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-2 py-2 text-[15px] font-semibold transition-all duration-200 hover:bg-[var(--brand-trust-blue-soft)]/60 active:scale-[0.99]";
const primaryLine =
  "border-b-2 border-transparent hover:border-[color-mix(in_srgb,var(--brand-trust-blue)_45%,transparent)] hover:gap-2.5";

/** 주요 텍스트 액션: 라벨 + 화살표, 하단 라인 + 화살표 미세 이동 */
export function TextActionLink({
  className,
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link className={cn(primaryBase, primaryLine, className)} {...props}>
      <span>{children}</span>
      <ArrowRight
        className="size-[1.125rem] shrink-0 opacity-90 transition-transform duration-200 group-hover/text-act:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

/** 본문·보조 링크: 밑줄 중심 */
export function InlineTextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "font-medium text-[var(--link-color)] underline decoration-[color-mix(in_srgb,var(--brand-trust-blue)_45%,transparent)] decoration-2 underline-offset-[6px] transition-colors duration-200",
        "rounded-sm px-0.5 py-1.5 hover:bg-[var(--brand-trust-blue-soft)]/50 hover:decoration-[var(--brand-trust-blue)] hover:text-[var(--link-hover)] active:opacity-90",
        className,
      )}
      {...props}
    />
  );
}

/** 보조 텍스트 액션: 틴트 + 얇은 밑줄 호버 */
export function TextActionSecondary({
  className,
  children,
  showArrow = true,
  ...props
}: ComponentProps<typeof Link> & { showArrow?: boolean }) {
  return (
    <Link
      className={cn(
        "group/text-sec text-muted-foreground hover:text-foreground -mx-1 inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-2 text-sm font-medium transition-colors duration-200",
        "border-b-2 border-transparent hover:border-foreground/20 hover:bg-muted/60",
        showArrow && "hover:gap-2",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {showArrow ? (
        <ArrowRight
          className="size-3.5 shrink-0 opacity-70 transition-transform duration-200 group-hover/text-sec:translate-x-0.5 group-hover/text-sec:opacity-100"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}
