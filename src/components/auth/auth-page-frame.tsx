import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function AuthPageFrame({ title, description, children, className }: Props) {
  return (
    <section className="bg-[var(--bg)] flex min-h-[min(100dvh,56rem)] flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <div className="flex items-center justify-end">
          <LanguageSwitcher className="shadow-sm" />
        </div>

        <Card size="sm" className={cn("border-border/70 shadow-[var(--shadow-sm)]", className)}>
          <CardHeader className="border-border/60 space-y-3 border-b px-5 pt-6 pb-5 sm:px-6">
            <div className="flex items-center justify-center">
              <Logo variant="full" size={34} />
            </div>
            <p className="text-muted-foreground text-center text-xs sm:text-sm">{BRAND.tagline}</p>
            <div className="space-y-1 text-center">
              <h1 className="text-text-strong text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-muted-foreground text-sm leading-relaxed sm:text-[15px]">{description}</p>
            </div>
          </CardHeader>
          <CardContent className="px-5 py-6 sm:px-6">{children}</CardContent>
        </Card>
      </div>
    </section>
  );
}
