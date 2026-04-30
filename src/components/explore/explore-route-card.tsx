"use client";

import type { ContentPost } from "@/types/domain";
import { Link } from "@/i18n/navigation";
import { routeCardAreaLabel, routeCardSpotPreviewLine } from "@/lib/route-post-card-meta";
import { useRouteRepresentativeCoverImage } from "@/hooks/use-route-representative-cover-image";
import { MapPin, Clock, ArrowRight } from "lucide-react";

export function ExploreRouteCard({ post }: { post: ContentPost }) {
  const { url: coverUrl, alt: coverAlt, onCoverImgError } = useRouteRepresentativeCoverImage(post);
  const spots = post.route_journey?.spots ?? [];
  const meta = post.route_journey?.metadata;
  const durationMin = meta?.estimated_total_duration_minutes;
  const allTags = post.tags.slice(0, 3);
  const areaLabel = routeCardAreaLabel(post);
  const spotPreview = routeCardSpotPreviewLine(post, 2);
  const distanceKm = meta?.estimated_total_distance_km;

  return (
    <li>
      <Link
        href={`/posts/${post.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-line bg-bg-card transition-shadow hover:shadow-[var(--shadow-md)]"
      >
        <div className="relative h-40 w-full overflow-hidden bg-bg-sunken">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={coverAlt}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              onError={onCoverImgError}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <MapPin className="size-8 text-line" strokeWidth={1.5} />
            </div>
          )}
          {spots.length > 0 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-bg-dark/80 px-2.5 py-0.5 text-[10px] font-semibold text-bg backdrop-blur-sm">
              스팟 {spots.length}곳
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent-ksm/10 px-2 py-0.5 text-[10px] font-semibold text-accent-ksm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h2 className="font-serif text-base font-semibold text-ink leading-snug line-clamp-2 group-hover:text-accent-ksm transition-colors">
            {post.title}
          </h2>

          {post.summary && (
            <p className="text-xs text-ink-muted leading-relaxed line-clamp-1">{post.summary}</p>
          )}

          <p className="text-[10px] leading-snug text-ink-muted line-clamp-2">
            <span className="font-semibold text-ink-soft">{areaLabel}</span>
            {spotPreview ? (
              <>
                <span className="mx-1 text-line">·</span>
                <span>{spotPreview}</span>
              </>
            ) : null}
          </p>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-whisper pt-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-soft">
              {typeof distanceKm === "number" ? (
                <span className="tabular-nums">약 {distanceKm.toFixed(1)}km</span>
              ) : null}
              {durationMin != null && durationMin > 0 ? (
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
                  {durationMin < 120 ? `약 ${Math.round(durationMin)}분` : `약 ${Math.round(durationMin / 60)}시간`}
                </span>
              ) : null}
              <span className="min-w-0 truncate font-medium text-ink-muted">{post.author_display_name}</span>
            </div>
            <ArrowRight
              className="size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-accent-ksm"
              strokeWidth={1.75}
            />
          </div>
        </div>
      </Link>
    </li>
  );
}
