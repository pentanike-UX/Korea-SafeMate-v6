"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { MatchRequestStatus } from "@/lib/traveler-match-requests";
import { Loader2 } from "lucide-react";

export function TravelerMatchCompleteButton({ matchId }: { matchId: string }) {
  const t = useTranslations("TravelerHub");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(status: MatchRequestStatus) {
    setLoading(true);
    try {
      const res = await fetch(`/api/traveler/match-requests/${matchId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 rounded-lg"
      disabled={loading}
      onClick={() => void patch("completed")}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
      {t("matchMarkCompleted")}
    </Button>
  );
}

export function GuardianMatchAcceptButton({
  matchId,
  onSuccess,
}: {
  matchId: string;
  onSuccess?: () => void;
}) {
  const t = useTranslations("TravelerHub");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    try {
      const res = await fetch(`/api/traveler/match-requests/${matchId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });
      if (res.ok) {
        onSuccess?.();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" size="sm" className="h-9 rounded-lg font-semibold" disabled={loading} onClick={() => void accept()}>
      {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
      {t("matchAccept")}
    </Button>
  );
}
