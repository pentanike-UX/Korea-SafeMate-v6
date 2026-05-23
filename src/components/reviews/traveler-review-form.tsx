"use client";

import { useState, useTransition } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitTravelerReviewAction } from "@/app/[locale]/(authed)/mypage/requests/[id]/review-actions";

/**
 * T15 — 여행자 리뷰 작성 폼.
 * delivered/completed 예약에서만 노출. 제출 후 성공 상태로 전환.
 */
export function TravelerReviewForm({
  bookingId,
  isKo,
  alreadyReviewed = false,
}: {
  bookingId: string;
  isKo: boolean;
  alreadyReviewed?: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadyReviewed);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="flex items-center gap-2.5 rounded-[var(--radius-xl)] border border-ok/30 bg-ok/5 p-4">
        <CheckCircle2 className="size-5 shrink-0 text-ok" aria-hidden />
        <p className="text-sm font-medium text-ink">
          {isKo ? "리뷰를 남겨 주셔서 감사합니다." : "Thank you for your review."}
        </p>
      </div>
    );
  }

  function submit() {
    setError(null);
    if (rating < 1) {
      setError(isKo ? "별점을 선택해 주세요." : "Please select a rating.");
      return;
    }
    startTransition(async () => {
      const res = await submitTravelerReviewAction({ bookingId, rating, comment, isAnonymous });
      if (res.ok) {
        setDone(true);
      } else {
        setError(res.error ?? (isKo ? "제출에 실패했습니다." : "Submission failed."));
      }
    });
  }

  const activeStar = hover || rating;

  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-bg-card p-5 space-y-4">
      <div>
        <h2 className="font-serif text-lg font-semibold text-ink">
          {isKo ? "이 하루이는 어떠셨나요?" : "How was this haruee?"}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {isKo
            ? "솔직한 후기는 다른 여행자에게 큰 도움이 됩니다."
            : "Your honest feedback helps other travelers."}
        </p>
      </div>

      {/* 별점 */}
      <div className="flex items-center gap-1" role="radiogroup" aria-label={isKo ? "별점" : "Rating"}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n}`}
            className="p-0.5"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
          >
            <Star
              className={cn(
                "size-7 transition-colors",
                n <= activeStar ? "fill-amber-400 text-amber-400" : "text-line",
              )}
            />
          </button>
        ))}
        {rating > 0 ? (
          <span className="ml-2 text-sm font-semibold text-ink tabular-nums">{rating}.0</span>
        ) : null}
      </div>

      {/* 코멘트 */}
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        maxLength={2000}
        className="rounded-[var(--radius-lg)] text-sm"
        placeholder={
          isKo
            ? "동선이 잘 맞았는지, 메모가 도움이 됐는지 적어 주세요. (선택)"
            : "Tell us if the route fit well and the notes were helpful. (optional)"
        }
      />

      {/* 익명 토글 */}
      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="size-4 rounded border-line accent-[var(--brand-primary)]"
        />
        {isKo ? "익명으로 작성" : "Post anonymously"}
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button
        type="button"
        disabled={pending}
        onClick={submit}
        className="gap-2 rounded-[var(--radius-md)] bg-accent-ksm text-white hover:bg-accent-dark"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {isKo ? "리뷰 등록" : "Submit review"}
      </Button>
    </div>
  );
}
