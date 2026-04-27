"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  nextPath: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginCardClient({ nextPath }: Props) {
  const t = useTranslations("Auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"traveler" | "guardian">("traveler");

  const safeNext = useMemo(() => safeNextPath(nextPath) ?? "/explore", [nextPath]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setError(t("error.invalidEmail"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalized, next: safeNext }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { code?: string } | null;
        if (payload?.code === "rate_limit") setError(t("error.rateLimit"));
        else if (payload?.code === "network") setError(t("error.network"));
        else setError(t("error.loginFailed"));
        return;
      }

      setInfo(t("login.otpSent"));
    } catch {
      setError(t("error.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Tabs value={tab} onValueChange={(value) => setTab(value as "traveler" | "guardian")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="traveler">{t("login.travelerTab")}</TabsTrigger>
          <TabsTrigger value="guardian">{t("login.guardianTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="traveler" className="space-y-4">
          <form className="space-y-3" onSubmit={(event) => void onSubmit(event)}>
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("login.emailPlaceholder")}
              aria-invalid={Boolean(error)}
            />
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? t("common.loading") : t("login.emailButton")}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="guardian" className="space-y-4">
          <p className="text-muted-foreground rounded-[var(--radius-md)] bg-muted/40 px-4 py-3 text-sm leading-relaxed">
            {t("login.guardianHint")}
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/guardians/apply">{t("login.guardianCta")}</Link>
          </Button>
          <form className="space-y-3" onSubmit={(event) => void onSubmit(event)}>
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("login.emailPlaceholder")}
              aria-invalid={Boolean(error)}
            />
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? t("common.loading") : t("login.emailButton")}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="text-muted-foreground text-center text-xs">{t("common.divider")}</div>

      <GoogleSignInButton returnPath={safeNext} className="min-h-12 w-full text-base font-semibold" />

      {error ? (
        <p className="bg-destructive/10 text-destructive rounded-[var(--radius-md)] px-3 py-2 text-sm">{error}</p>
      ) : null}
      {info ? (
        <p className="bg-emerald-500/10 text-emerald-700 rounded-[var(--radius-md)] px-3 py-2 text-sm dark:text-emerald-300">
          {info}
        </p>
      ) : null}

      <p className="text-muted-foreground text-center text-sm">
        {t("login.signupPrompt")}{" "}
        <Link href={{ pathname: "/signup", query: { next: safeNext } }} className="text-foreground font-semibold underline underline-offset-4">
          {t("login.signupLink")}
        </Link>
      </p>
    </div>
  );
}
