import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function MypageActionLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-primary inline-flex min-h-10 items-center gap-1 rounded-md px-1 text-sm font-semibold underline decoration-transparent underline-offset-4 transition hover:underline hover:decoration-current",
        className,
      )}
    >
      <span>{children}</span>
      <ChevronRight className="size-4" aria-hidden />
    </Link>
  );
}
