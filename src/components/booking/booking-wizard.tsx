"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useMemo, useState } from "react";
import { mockRegions, mockServiceTypes } from "@/data/mock";
import type { ServiceTypeCode } from "@/types/domain";
import {
  emptyWizardState,
  HANDOFF_CHANNEL_OPTIONS,
  INTEREST_OPTIONS,
  LANGUAGE_OPTIONS,
  SERVICE_CODES,
  SUPPORT_NEED_OPTIONS,
  TRAVELER_USER_TYPE_OPTIONS,
  type WizardFormState,
} from "@/lib/booking-wizard-config";
import { validateStep } from "@/lib/booking-wizard-validation";
import { wizardStateToPayload } from "@/lib/booking-submit";
import { BookingFlowScopePanel } from "@/components/booking/booking-flow-scope-panel";
import { BookingProgress } from "@/components/booking/booking-progress";
import { BookingSummaryCard } from "@/components/booking/booking-summary-card";
import { TrustBoundaryCardClient } from "@/components/trust/trust-boundary-card-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function isServiceCode(v: string | null): v is ServiceTypeCode {
  return v !== null && (SERVICE_CODES as string[]).includes(v);
}

function toggleArray<T extends string>(arr: T[], id: T): T[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialService = useMemo(() => {
    const q = searchParams.get("service");
    return isServiceCode(q) ? q : "arrival";
  }, [searchParams]);

  const [step, setStep] = useState(0);
  const [s, setS] = useState<WizardFormState>(() => ({
    ...emptyWizardState(),
    serviceCode: initialService,
  }));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof WizardFormState>(key: K, value: WizardFormState[K]) => {
    setS((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  function goNext() {
    const v = validateStep(step, s);
    if (!v.ok) {
      setError(v.message);
      return;
    }
    setError(null);
    setStep((x) => Math.min(x + 1, 4));
  }

  function goBack() {
    setError(null);
    setStep((x) => Math.max(x - 1, 0));
  }

  async function submit() {
    const v = validateStep(4, s);
    if (!v.ok) {
      setError(v.message);
      return;
    }
    setSubmitting(true);
    setError(null);
    let payload: ReturnType<typeof wizardStateToPayload>;
    try {
      payload = wizardStateToPayload(s);
    } catch {
      setError("Please complete all steps before submitting.");
      setSubmitting(false);
      return;
    }
    try {
      // TODO(prod): Authenticated flow — attach `traveler_user_id` server-side from session.
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { id?: string; saved?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      const id = data.id ?? "unknown";
      try {
        sessionStorage.setItem(
          "ksm_booking_success",
          JSON.stringify({ id, payload, saved: Boolean(data.saved) }),
        );
      } catch {
        /* sessionStorage unavailable */
      }
      router.push(`/book/success?id=${encodeURIComponent(id)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const sortedRegions = useMemo(
    () => [...mockRegions].sort((a, b) => a.phase - b.phase || a.name.localeCompare(b.name)),
    [],
  );

  const reviewPayload = useMemo(() => {
    if (step !== 4) return null;
    try {
      return wizardStateToPayload(s);
    } catch {
      return null;
    }
  }, [step, s]);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_22rem] lg:gap-10">
      <div className="min-w-0 space-y-8">
        <BookingProgress currentStep={step} />

        <div className="bg-muted/30 rounded-xl border border-dashed p-4 text-sm leading-relaxed text-muted-foreground">
          <p className="text-foreground font-medium">How this works</p>
          <p className="mt-1">
            You are submitting a <strong className="text-foreground font-medium">support request</strong>, not
            buying an instant tour. We review context, match a suitable Guardian when possible, then share
            external chat details <strong className="text-foreground font-medium">only after approval</strong>.
          </p>
        </div>

        {error ? (
          <p className="text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-sm" role="alert">
            {error}
          </p>
        ) : null}

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Choose your support type</h2>
            <p className="text-muted-foreground text-sm">
              Pick the session that best matches your first priorities. You can clarify details in the next
              steps.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {mockServiceTypes.map((svc) => (
                <button
                  key={svc.code}
                  type="button"
                  onClick={() => update("serviceCode", svc.code)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all",
                    s.serviceCode === svc.code
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/30 hover:bg-muted/40",
                  )}
                >
                  <p className="font-semibold">{svc.name}</p>
                  <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                    {svc.short_description}
                  </p>
                  <p className="text-muted-foreground mt-2 text-[10px]">~{svc.duration_hours}h · from ₩</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold tracking-tight">When, where, and who is traveling</h2>

            <div className="space-y-2">
              <Label>Traveler type</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {TRAVELER_USER_TYPE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => update("userType", o.value)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left text-sm transition-all",
                      s.userType === o.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <span className="font-medium">{o.label}</span>
                    <span className="text-muted-foreground block text-xs">{o.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="region">City / region</Label>
              <Select
                value={s.regionSlug || undefined}
                onValueChange={(v) => update("regionSlug", v ?? "")}
              >
                <SelectTrigger id="region" className="w-full">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {sortedRegions.map((r) => (
                    <SelectItem key={r.id} value={r.slug}>
                      {r.name} ({r.name_ko}) · Phase {r.phase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={s.date}
                  onChange={(e) => update("date", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Time (KST)</Label>
                <Input
                  id="time"
                  type="time"
                  value={s.time}
                  onChange={(e) => update("time", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="count">Number of travelers</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={8}
                  value={s.travelerCount}
                  onChange={(e) => update("travelerCount", Math.min(8, Math.max(1, Number(e.target.value) || 1)))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Preferred language</Label>
                <Select
                  value={s.preferredLanguage || undefined}
                  onValueChange={(v) => update("preferredLanguage", v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>First time in Korea?</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={s.firstTimeKorea === true ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => update("firstTimeKorea", true)}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={s.firstTimeKorea === false ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => update("firstTimeKorea", false)}
                >
                  No
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold tracking-tight">Context & support needs</h2>

            <div className="grid gap-2">
              <Label htmlFor="meet">Arrival or meeting point</Label>
              <Input
                id="meet"
                value={s.meetingPoint}
                onChange={(e) => update("meetingPoint", e.target.value)}
                placeholder="e.g. ICN T1, exit 3 / Seoul Station KTX gate"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stay">Accommodation area</Label>
              <Input
                id="stay"
                value={s.accommodationArea}
                onChange={(e) => update("accommodationArea", e.target.value)}
                placeholder="Neighborhood or hotel district"
              />
            </div>

            <div className="space-y-2">
              <Label>Interests (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => update("interests", toggleArray(s.interests, o.id))}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      s.interests.includes(o.id)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>What do you need help with?</Label>
              <p className="text-muted-foreground text-xs">Select all that apply.</p>
              <div className="flex flex-wrap gap-2">
                {SUPPORT_NEED_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => update("supportNeeds", toggleArray(s.supportNeeds, o.id))}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      s.supportNeeds.includes(o.id)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="gname">Full name</Label>
                <Input
                  id="gname"
                  value={s.guestName}
                  onChange={(e) => update("guestName", e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gemail">Email</Label>
                <Input
                  id="gemail"
                  type="email"
                  value={s.guestEmail}
                  onChange={(e) => update("guestEmail", e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="special">Special requests or constraints</Label>
              <Textarea
                id="special"
                value={s.specialRequests}
                onChange={(e) => update("specialRequests", e.target.value)}
                rows={4}
                placeholder="Mobility, dietary notes, anxiety triggers we should respect, tight flight connections…"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold tracking-tight">External contact handoff</h2>
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">After approval only</CardTitle>
                <CardDescription>
                  We do not open a live chat automatically. Operations will propose a match first; then you
                  receive handoff instructions for the channel you choose below.
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              {HANDOFF_CHANNEL_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => update("contactChannel", o.value)}
                  className={cn(
                    "rounded-xl border p-4 text-left text-sm transition-all",
                    s.contactChannel === o.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <span className="font-medium">{o.label}</span>
                  <span className="text-muted-foreground block text-xs">{o.hint}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="handle">
                {s.contactChannel === "email" ? "Email for handoff" : "ID / handle / number"}
              </Label>
              <Input
                id="handle"
                value={s.contactHandle}
                onChange={(e) => update("contactHandle", e.target.value)}
                placeholder={
                  s.contactChannel === "email"
                    ? "Can match your contact email or be different"
                    : "Exact ID we should use after match"
                }
                autoComplete="off"
              />
            </div>
          </div>
        )}

        {step === 4 && !reviewPayload ? (
          <p className="text-muted-foreground text-sm" role="status">
            Review could not be built from the current form. Use Back to complete earlier steps, then continue
            again.
          </p>
        ) : null}

        {step === 4 && reviewPayload ? (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold tracking-tight">Review & confirm</h2>
            <BookingSummaryCard payload={reviewPayload} />
            <BookingFlowScopePanel />

            <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
              <p className="text-foreground text-sm font-medium">Confirmations</p>
              <label className="text-muted-foreground flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  checked={s.agreedScope}
                  onChange={(e) => update("agreedScope", e.target.checked)}
                  className="border-input text-primary mt-1 size-4 rounded"
                />
                <span>
                  I understand this is practical companion support — not medical, legal, emergency response,
                  licensed tour commentary, or a guarantee of safety outcomes.
                </span>
              </label>
              <label className="text-muted-foreground flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  checked={s.agreedAdminReview}
                  onChange={(e) => update("agreedAdminReview", e.target.checked)}
                  className="border-input text-primary mt-1 size-4 rounded"
                />
                <span>
                  I understand my request will be{" "}
                  <span className="text-foreground font-medium">reviewed by the team</span> before any Guardian
                  match, and I may be asked follow-up questions.
                </span>
              </label>
              <label className="text-muted-foreground flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  checked={s.agreedNoImmediateChat}
                  onChange={(e) => update("agreedNoImmediateChat", e.target.checked)}
                  className="border-input text-primary mt-1 size-4 rounded"
                />
                <span>
                  I understand that{" "}
                  <span className="text-foreground font-medium">external chat is not immediate</span> and is only
                  for coordination after an approved match — not 24/7 monitoring or instant connection.
                </span>
              </label>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={goBack}
            disabled={step === 0 || submitting}
          >
            Back
          </Button>
          {step < 4 ? (
            <Button type="button" className="rounded-xl" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl"
              onClick={submit}
              disabled={submitting || !reviewPayload}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit request"
              )}
            </Button>
          )}
        </div>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <TrustBoundaryCardClient />
        <p className="text-muted-foreground text-xs leading-relaxed">
          {/* TODO(prod): Rate limiting, bot protection, and PII encryption for `request_payload`. */}
          Submissions are sent to our API. When Supabase is configured, rows are stored for admin matching;
          otherwise a reference ID is generated locally for MVP testing.
        </p>
      </aside>
    </div>
  );
}
