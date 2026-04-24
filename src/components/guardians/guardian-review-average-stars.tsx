import { Star } from "lucide-react";

/** 평균 평점(1~5, 소수)을 부분 채움 별로 표시 */
export function GuardianReviewAverageStars({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={label}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <div key={i} className="relative size-[1.125rem] shrink-0 sm:size-5">
            <Star className="size-[1.125rem] text-amber-200 sm:size-5" strokeWidth={1.5} aria-hidden />
            <div
              className="absolute left-0 top-0 h-full overflow-hidden text-amber-500"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="size-[1.125rem] fill-current sm:size-5" strokeWidth={1.5} aria-hidden />
            </div>
          </div>
        );
      })}
    </div>
  );
}
