"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { getOAuthRedirectOriginForClient } from "@/lib/site-url";
import { broadcastClientAuthContextChanged } from "@/lib/auth/client-auth-tab-sync";
import { invalidateClientPointsCache } from "@/lib/points/client-points-fetch-cache";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 로그인 직후 기본 목적지 — traveler 허브(마이페이지). 가디언 전환은 마이페이지에서 처리합니다. */
function defaultPostLoginPath(locale: string): string {
  return locale === routing.defaultLocale ? "/mypage" : `/${locale}/mypage`;
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={cn("shrink-0", className)} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type Props = {
  className?: string;
  /** 로그인 페이지 `?next=` — 승인 후 이 경로(로케일 포함)로 복귀 */
  returnPath?: string | null;
};

export function GoogleSignInButton({ className, returnPath = null }: Props) {
  const t = useTranslations("Login");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage(t("googleConfigMissing"));
      return;
    }

    await fetch("/api/dev/mock-guardian-logout", { method: "POST", credentials: "include" });
    invalidateClientPointsCache();
    broadcastClientAuthContextChanged();

    setLoading(true);
    try {
      const next = safeNextPath(returnPath) ?? defaultPostLoginPath(locale);
      const origin = getOAuthRedirectOriginForClient();
      const redirectTo = new URL("/auth/callback", origin);
      redirectTo.searchParams.set("next", next);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
        },
      });

      if (error) {
        setMessage(error.message || t("googleSignInFailed"));
        setLoading(false);
      }
    } catch {
      setMessage(t("googleSignInFailed"));
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={loading}
        onClick={() => void handleClick()}
        className={cn("w-full rounded-[var(--radius-md)] border-2 font-semibold", className)}
      >
        <GoogleMark className="size-5" />
        {loading ? t("googleSigningIn") : t("continueGoogle")}
      </Button>
      {message ? <p className="text-destructive text-center text-sm leading-snug">{message}</p> : null}
    </div>
  );
}
