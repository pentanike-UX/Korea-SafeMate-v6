import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
import { Link } from "@/i18n/navigation";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { MockGuardianQuickLogin } from "@/components/auth/mock-guardian-quick-login";
import { BRAND } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TextActionLink } from "@/components/ui/text-action";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("Login");
  return {
    title: `${t("metaTitle")} | ${BRAND.name}`,
  };
}

type Props = {
  searchParams: Promise<{ error?: string; next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const t = await getTranslations("Login");
  const tBrand = await getTranslations("Brand");
  const sp = await searchParams;
  const { error } = sp;
  const nextParam = typeof sp.next === "string" ? sp.next : Array.isArray(sp.next) ? sp.next[0] : null;
  const errorMessage =
    error === "oauth"
      ? t("oauthFailed")
      : error === "config"
        ? t("googleConfigMissing")
        : null;

  return (
    <div className="bg-[var(--bg-page)] flex min-h-[min(100dvh,48rem)] flex-1 flex-col px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-0">
        <Card
          size="sm"
          className={cn(
            "border-border/70 shadow-[var(--shadow-sm)]",
            "py-0 gap-0 overflow-hidden",
          )}
        >
          <CardHeader className="border-border/60 space-y-4 border-b px-5 pt-6 pb-5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="bg-[var(--brand-primary)] text-[var(--text-on-brand)] flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-sm font-bold shadow-sm ring-2 ring-[color-mix(in_srgb,var(--brand-trust-blue)_35%,transparent)]">
                42
              </span>
              <div className="min-w-0 leading-tight">
                <span className="text-text-strong block truncate text-sm font-semibold tracking-tight">{BRAND.name}</span>
                <span className="text-muted-foreground block truncate text-[11px] font-medium sm:text-xs">{tBrand("tagline")}</span>
              </div>
            </div>
            <p className="text-muted-foreground text-[13px] leading-relaxed">{t("cardIntro")}</p>
          </CardHeader>
          <CardContent className="space-y-6 px-5 pt-6 pb-2 sm:px-6">
            <div className="space-y-1.5">
              <CardTitle className="text-text-strong text-xl font-semibold tracking-tight sm:text-2xl">{t("title")}</CardTitle>
              <CardDescription className="text-[15px] leading-relaxed">{t("description")}</CardDescription>
            </div>

            {errorMessage ? (
              <p className="bg-destructive/10 text-destructive rounded-[var(--radius-md)] px-4 py-3 text-sm leading-snug">
                {errorMessage}
              </p>
            ) : null}

            <GoogleSignInButton returnPath={nextParam} className="min-h-14 w-full text-base font-semibold" />

            <div className="pt-1">
              <TextActionLink href="/explore" className="text-muted-foreground hover:text-foreground justify-center text-sm font-medium">
                {t("browseWithoutLogin")}
              </TextActionLink>
            </div>
          </CardContent>
          <CardFooter className="border-border/60 text-muted-foreground flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t px-5 py-4 text-center text-xs sm:px-6">
            <Link href="/about#terms" className="underline-offset-4 hover:underline">
              {t("footerTerms")}
            </Link>
            <span className="opacity-40" aria-hidden>
              ·
            </span>
            <Link href="/about#privacy" className="underline-offset-4 hover:underline">
              {t("footerPrivacy")}
            </Link>
            <span className="opacity-40" aria-hidden>
              ·
            </span>
            <NextLink href="/admin/dashboard" className="underline-offset-4 hover:underline">
              {t("footerAdmin")}
            </NextLink>
          </CardFooter>
        </Card>
        <MockGuardianQuickLogin className="mt-6" />
      </div>
    </div>
  );
}
