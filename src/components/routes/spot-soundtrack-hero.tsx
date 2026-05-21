"use client";

import { Play, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppLocale, HaruSpot, LocaleMap, SpotArtist, SpotTrack } from "@/types/haru";

/**
 * 시트 상단의 "이 스팟의 메인 곡" 영웅 카드 (C 패턴).
 * spot.soundtrack에 명시된 artist_id + track_id를 찾아 한 곡을 큐레이션해 노출.
 * - 좌측: 큰 정사각 커버(그라데이션 + 트랙명 fallback)
 * - 우측: 곡 제목 / 아티스트 / curator_note / "유튜브에서 듣기" CTA
 * - 클릭 영역 전체가 곡의 YouTube로 새 창 이동
 */
export function SpotSoundtrackHero({
  spot,
  locale,
}: {
  spot: HaruSpot;
  locale: AppLocale;
}) {
  const sd = spot.soundtrack;
  if (!sd || !spot.artists?.length) return null;

  const artist = spot.artists.find((a) => a.id === sd.artist_id);
  const track = artist?.tracks?.find((t) => t.id === sd.track_id);
  if (!artist || !track) return null;

  const note = pickLocale(sd.curator_note, locale);

  return (
    <a
      href={track.youtube_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${track.title} — ${artist.name} (YouTube)`}
      className={cn(
        "group relative flex items-stretch gap-3 overflow-hidden rounded-2xl border border-border/40",
        "bg-gradient-to-br from-card to-card/40 p-3 transition-shadow hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ksm",
      )}
    >
      <TrackCover track={track} artist={artist} size="hero" />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            ♪ Soundtrack of this spot
          </p>
          <p className="text-base font-bold leading-tight text-foreground">
            {track.title}
            {track.title_ko && track.title_ko !== track.title ? (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                〈{track.title_ko}〉
              </span>
            ) : null}
          </p>
          <p className="text-xs text-foreground/70">
            {artist.name}
            {track.year ? <span className="ml-1.5 text-muted-foreground">· {track.year}</span> : null}
          </p>
        </div>
        {note ? (
          <p className="text-[11.5px] leading-snug text-foreground/75 line-clamp-3 italic">
            “{note}”
          </p>
        ) : null}
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-foreground/90 px-2.5 py-1 text-[10.5px] font-bold text-background transition-transform group-hover:translate-x-0.5">
          <Play className="size-3 fill-current" />
          YouTube에서 듣기
          <ExternalLink className="size-2.5 opacity-70" />
        </span>
      </div>
    </a>
  );
}

/**
 * 트랙 커버 시각 컴포넌트 — 다른 컴포넌트에서도 재사용.
 * - cover_url이 있으면 background-image로 사용
 * - 없으면 아티스트 accent_class 그라데이션 + 트랙명 텍스트
 */
export function TrackCover({
  track,
  artist,
  size = "md",
}: {
  track: SpotTrack;
  artist: Pick<SpotArtist, "accent_class" | "initials">;
  size?: "sm" | "md" | "hero";
}) {
  const dim =
    size === "hero" ? "h-32 w-32 sm:h-36 sm:w-36" : size === "md" ? "h-24 w-24" : "h-16 w-16";
  const titleSize = size === "hero" ? "text-base" : size === "md" ? "text-xs" : "text-[10px]";

  if (track.cover_url) {
    return (
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl bg-cover bg-center shadow-md",
          dim,
        )}
        style={{ backgroundImage: `url(${track.cover_url})` }}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={cn(
        "relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl text-white shadow-md",
        artist.accent_class ?? "bg-violet-600",
        dim,
      )}
      aria-hidden
    >
      {/* 비닐/CD 무드 라인 — 미니멀하게 */}
      <span className="absolute inset-1 rounded-lg border border-white/15" aria-hidden />
      <span className="absolute right-2 top-2 text-[9px] font-bold uppercase tracking-wider opacity-70">
        ♪
      </span>
      <span className={cn("px-2 text-center font-bold leading-tight line-clamp-3", titleSize)}>
        {track.title_ko ?? track.title}
      </span>
      {track.year ? (
        <span className="absolute bottom-1.5 text-[8.5px] font-semibold uppercase tracking-wider opacity-70">
          {track.year}
        </span>
      ) : null}
    </span>
  );
}

function pickLocale(map: LocaleMap | undefined, locale: AppLocale): string | undefined {
  if (!map) return undefined;
  const order: AppLocale[] = [locale, "en", "ko", "th", "vi"];
  for (const l of order) {
    const v = map[l];
    if (v) return v;
  }
  return undefined;
}
