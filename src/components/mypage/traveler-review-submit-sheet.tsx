"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { FILL_IMAGE_POST_THUMB_SQUARE } from "@/lib/ui/fill-image";
import { cn } from "@/lib/utils";

const TAG_KEYS = ["routeEasy", "explainSimple", "calming", "vibeMatch", "photoFriendly", "fastResponse"] as const;

const IMAGE_PRESETS: { id: string; thumb: string }[] = [
  { id: "", thumb: "" },
  { id: "/mock/posts/강남_001.jpg", thumb: "/mock/posts/강남_001.jpg" },
  { id: "/mock/posts/강남_010.jpg", thumb: "/mock/posts/강남_010.jpg" },
  { id: "/mock/posts/광화문_003.jpg", thumb: "/mock/posts/광화문_003.jpg" },
  { id: "/mock/posts/광화문_022.jpg", thumb: "/mock/posts/광화문_022.jpg" },
];

export function TravelerReviewSubmitSheet({
  matchId,
  guardianDisplayName,
  disabled,
  disabledReason,
  alreadyReviewed,
}: {
  matchId: string;
  guardianDisplayName: string;
  disabled: boolean;
  disabledReason?: string;
  alreadyReviewed: boolean;
}) {
  const t = useTranslations("TravelerHub");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imagePreset, setImagePreset] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleTag(key: string) {
    setTags((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key].slice(0, 6)));
  }

  async function submit() {
    setErr(null);
    if (comment.trim().length < 8) {
      setErr(t("reviewFormErrorShort"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/traveler/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          rating,
          comment: comment.trim(),
          tagIds: tags,
          imagePreset,
          reviewerName: name.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        if (data.error === "already_reviewed") setErr(t("reviewFormErrorDuplicate"));
        else if (data.error === "match_not_eligible") setErr(t("reviewFormErrorEligible"));
        else if (data.error === "guardian_cannot_submit") setErr(t("reviewFormErrorRole"));
        else setErr(t("reviewFormErrorGeneric"));
        return;
      }
      setOpen(false);
      setComment("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (alreadyReviewed) {
    return (
      <span className="text-muted-foreground inline-flex min-h-9 items-center rounded-lg border border-dashed px-3 text-xs font-medium">
        {t("reviewAlreadySubmitted")}
      </span>
    );
  }

  if (disabled) {
    return (
      <span className="text-muted-foreground text-xs leading-relaxed" title={disabledReason}>
        {disabledReason ?? t("reviewFormDisabled")}
      </span>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button type="button" variant="secondary" size="sm" className="h-9 rounded-lg font-semibold" />}
      >
        {t("reviewOpenSheet")}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[min(92dvh,40rem)] rounded-t-2xl px-4 pb-6 pt-2 sm:max-w-lg sm:rounded-t-2xl">
        <SheetHeader className="border-border/60 border-b pb-4 text-left">
          <SheetTitle className="text-lg">{t("reviewSheetTitle", { name: guardianDisplayName })}</SheetTitle>
          <p className="text-muted-foreground text-sm font-normal">{t("reviewSheetLead")}</p>
        </SheetHeader>
        <div className="max-h-[min(70dvh,28rem)] space-y-5 overflow-y-auto py-4">
          {err ? <p className="text-destructive text-sm">{err}</p> : null}
          <div>
            <p className="text-foreground mb-2 text-sm font-medium">{t("reviewFieldRating")}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="rounded-md p-1 transition-colors hover:bg-muted"
                  aria-label={t("reviewStarPick", { n })}
                >
                  <Star className={cn("size-8", n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rv-name">{t("reviewFieldName")}</Label>
            <Input
              id="rv-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("reviewFieldNamePh")}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rv-body">{t("reviewFieldBody")}</Label>
            <Textarea
              id="rv-body"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              placeholder={t("reviewFieldBodyPh")}
              className="rounded-xl"
            />
          </div>
          <div>
            <p className="text-foreground mb-2 text-sm font-medium">{t("reviewFieldTags")}</p>
            <div className="flex flex-wrap gap-2">
              {TAG_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleTag(key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    tags.includes(key)
                      ? "border-[var(--brand-trust-blue)] bg-[var(--brand-trust-blue-soft)] text-[var(--brand-trust-blue)]"
                      : "border-border/70 bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {t(`reviewHelpTag.${key}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-foreground mb-2 text-sm font-medium">{t("reviewFieldPhoto")}</p>
            <div className="flex flex-wrap gap-2">
              {IMAGE_PRESETS.map((p) => (
                <button
                  key={p.id || "none"}
                  type="button"
                  onClick={() => setImagePreset(p.id)}
                  className={cn(
                    "relative size-14 overflow-hidden rounded-lg border-2 transition-colors",
                    imagePreset === p.id ? "border-[var(--brand-trust-blue)]" : "border-transparent ring-1 ring-border/60",
                  )}
                >
                  {p.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small preset thumbs
                    <img src={p.thumb} alt="" className={cn("size-full", FILL_IMAGE_POST_THUMB_SQUARE)} />
                  ) : (
                    <span className="text-muted-foreground flex size-full items-center justify-center text-[10px] font-medium">
                      {t("reviewPhotoNone")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <SheetFooter className="gap-2 border-t pt-4 sm:flex-col-reverse">
          <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => setOpen(false)}>
            {t("reviewCancel")}
          </Button>
          <Button
            type="button"
            className="w-full rounded-xl font-semibold"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {t("reviewSubmit")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
