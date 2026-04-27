"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  nextPath: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function SignupCardClient({ nextPath }: Props) {
  const t = useTranslations("Auth");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const safeNext = useMemo(() => safeNextPath(nextPath) ?? "/explore", [nextPath]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();

    if (!normalizedName) {
      setError(t("signup.nameRequired"));
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setError(t("error.invalidEmail"));
      return;
    }
    if (!agree) {
      setError(t("signup.termsRequired"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          next: safeNext,
          agree,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { code?: string } | null;
        if (payload?.code === "email_exists") setError(t("error.emailExists"));
        else if (payload?.code === "rate_limit") setError(t("error.rateLimit"));
        else if (payload?.code === "network") setError(t("error.network"));
        else setError(t("error.signupFailed"));
        return;
      }

      setInfo(t("signup.otpSent"));
    } catch {
      setError(t("error.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="space-y-3" onSubmit={(event) => void onSubmit(event)}>
        <Input
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder={t("signup.namePlaceholder")}
        />
        <Input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("signup.emailPlaceholder")}
        />

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border border-input"
            checked={agree}
            onChange={(event) => setAgree(event.target.checked)}
          />
          <span className="text-muted-foreground leading-relaxed">
            {t("signup.termsLabel")}{" "}
            <Link href="/about#terms" className="text-foreground underline underline-offset-4">
              {t("signup.termsLink")}
            </Link>{" "}
            {t("common.and")}{" "}
            <Link href="/about#privacy" className="text-foreground underline underline-offset-4">
              {t("signup.privacyLink")}
            </Link>
          </span>
        </label>

        <Button type="submit" className="w-full font-semibold" disabled={loading}>
          {loading ? t("common.loading") : t("signup.emailButton")}
        </Button>
      </form>

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
        {t("signup.loginPrompt")}{" "}
        <Link href={{ pathname: "/login", query: { next: safeNext } }} className="text-foreground font-semibold underline underline-offset-4">
          {t("signup.loginLink")}
        </Link>
      </p>
    </div>
  );
}
