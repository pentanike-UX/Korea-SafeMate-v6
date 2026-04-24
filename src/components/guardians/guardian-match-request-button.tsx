"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { HeartHandshake, Loader2 } from "lucide-react";

export function GuardianMatchRequestButton({
  guardianUserId,
  guardianDisplayName,
  canRequest,
}: {
  guardianUserId: string;
  guardianDisplayName: string;
  /** Supabase 여행자 세션이 있을 때만 true (모의 가디언 전용 세션에서는 false) */
  canRequest: boolean;
}) {
  const t = useTranslations("TravelerHub");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/traveler/match-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardian_user_id: guardianUserId,
          guardian_display_name: guardianDisplayName,
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (res.status === 409) {
        setMsg(t("matchRequestAlready"));
        return;
      }
      if (!res.ok) {
        setMsg(data.error ?? t("matchRequestError"));
        return;
      }
      setMsg(t("matchRequestSent"));
    } catch {
      setMsg(t("matchRequestError"));
    } finally {
      setLoading(false);
    }
  }

  if (!canRequest) {
    return (
      <div className="border-border/60 bg-muted/20 rounded-2xl border border-dashed p-4">
        <p className="text-muted-foreground text-sm leading-relaxed">{t("matchRequestNeedTravelerLogin")}</p>
        <Button asChild variant="outline" className="mt-3 h-11 rounded-xl font-semibold">
          <Link href="/login">{t("goLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button
        type="button"
        variant="secondary"
        className="h-11 rounded-2xl font-semibold"
        disabled={loading}
        onClick={() => void submit()}
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <HeartHandshake className="size-4" aria-hidden />}
        {t("matchRequestCta")}
      </Button>
      {msg ? <p className="text-muted-foreground text-sm">{msg}</p> : null}
    </div>
  );
}
