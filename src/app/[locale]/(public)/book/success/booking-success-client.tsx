"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { BookingRequestPayload, ServiceTypeCode } from "@/types/domain";
import { mockServiceTypes } from "@/data/mock";
import { CONTACT_CHANNEL_LABELS } from "@/lib/constants";
import { BookingSummaryCard } from "@/components/booking/booking-summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

type Stored = { id: string; payload: BookingRequestPayload; saved: boolean };

function isServiceCode(v: string): v is ServiceTypeCode {
  return mockServiceTypes.some((s) => s.code === v);
}

export function BookingSuccessClient() {
  const t = useTranslations("BookingSuccess");
  const tSvc = useTranslations("Services");
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const [stored, setStored] = useState<Stored | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ksm_booking_success");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Stored;
      if (parsed?.payload && parsed?.id) setStored(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  const id = stored?.id ?? idParam ?? "—";
  const payload = stored?.payload;
  const svc =
    payload && isServiceCode(payload.service_code)
      ? tSvc(`cards.${payload.service_code}.title`)
      : null;
  const ch = payload?.preferred_contact_channel;
  const email = payload?.guest_email;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="bg-primary/10 text-primary mb-4 flex size-14 items-center justify-center rounded-2xl">
          <CheckCircle2 className="size-8" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
          {email ? t("body", { email }) : t("bodyNoEmail")}
        </p>
        <p className="text-muted-foreground mt-3 text-xs">
          {t("reference")} <span className="text-foreground font-mono">{id}</span>
          {stored && !stored.saved ? (
            <span className="block text-amber-700 dark:text-amber-400">{t("mvpNote")}</span>
          ) : null}
        </p>
      </div>

      {payload ? (
        <div className="space-y-6">
          <BookingSummaryCard payload={payload} />
          {svc ? (
            <p className="text-muted-foreground text-center text-xs">
              {t("service")} <span className="text-foreground font-medium">{svc}</span>
              {ch ? (
                <>
                  {" "}
                  · {t("handoff")}{" "}
                  <span className="text-foreground font-medium">
                    {CONTACT_CHANNEL_LABELS[ch as keyof typeof CONTACT_CHANNEL_LABELS] ?? ch}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : (
        <Card className="border-primary/15">
          <CardHeader>
            <CardTitle className="text-base">{t("summaryUnavailableTitle")}</CardTitle>
            <CardDescription>{t("summaryUnavailableBody")}</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {t("summaryUnavailableHint")}
            {/* TODO(prod): Server-rendered success from booking id + auth. */}
          </CardContent>
        </Card>
      )}

      <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild className="rounded-xl">
          <Link href="/explore">{t("exploreIntel")}</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/services">{t("services")}</Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-xl">
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
    </div>
  );
}
