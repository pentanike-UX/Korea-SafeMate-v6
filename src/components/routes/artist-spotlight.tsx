"use client";

import Image from "next/image";
import { useState } from "react";
import { Globe, Youtube, Instagram, Play, ExternalLink, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpotArtist } from "@/types/haru";
import { TrackCover } from "@/components/routes/spot-soundtrack-hero";

/**
 * 시트 본문의 "Artist Spotlight" 섹션 (B 패턴).
 * 여러 아티스트가 묶인 스팟이면 칩 탭으로 본문 교체, 1명이면 칩 숨김.
 *
 * 구성 (per artist):
 *  1. 헤더: 아바타 + 이름·소속사
 *  2. 외부 링크 칩 row: 공식 사이트 / YouTube / Instagram / 소속사
 *  3. scene 인용
 *  4. 트랙 라이브러리 (가로 스크롤)
 *  5. 공식 영상 (16:9 카드 2~3개)
 */
export function ArtistSpotlight({
  artists,
  label = "Artist Spotlight",
}: {
  artists: SpotArtist[] | undefined;
  label?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(artists?.[0]?.id ?? null);
  if (!artists || artists.length === 0) return null;

  const active = artists.find((a) => a.id === activeId) ?? artists[0]!;

  return (
    <section
      aria-label={label}
      className="rounded-2xl border border-border/40 bg-card/50 p-3.5"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          🎤 {label}
        </p>
        {artists.length > 1 ? (
          <p className="text-[10px] text-muted-foreground">{artists.length}명</p>
        ) : null}
      </header>

      {/* 다중 아티스트 — 칩 탭 */}
      {artists.length > 1 ? (
        <div className="mb-3 flex flex-wrap gap-1.5" role="tablist">
          {artists.map((a) => {
            const isActive = a.id === active.id;
            return (
              <button
                key={a.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(a.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ksm",
                  isActive
                    ? cn(a.accent_class ?? "bg-foreground text-background", "shadow-sm")
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                <ArtistDot artist={a} active={isActive} />
                {a.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <ArtistPanel artist={active} />
    </section>
  );
}

function ArtistPanel({ artist }: { artist: SpotArtist }) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex gap-3">
        <ArtistAvatar artist={artist} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <p className="text-sm font-bold text-foreground">{artist.name}</p>
            {artist.name_en && artist.name_en !== artist.name ? (
              <span className="text-[11px] text-muted-foreground">· {artist.name_en}</span>
            ) : null}
          </div>
          {artist.agency ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              <Building2 className="mr-1 inline size-3 -translate-y-px opacity-60" aria-hidden />
              {artist.agency}
            </p>
          ) : null}
        </div>
      </div>

      {/* 외부 링크 칩 row */}
      <LinkChips artist={artist} />

      {/* scene 인용 */}
      {artist.scene ? (
        <p className="text-[12px] leading-relaxed italic text-foreground/80 border-l-2 border-foreground/15 pl-3">
          “{artist.scene}”
        </p>
      ) : null}

      {/* 대표곡 칩 (rep_works) — 트랙이 없는 경우에도 텍스트로 노출 */}
      {artist.rep_works && artist.rep_works.length > 0 && !artist.tracks?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {artist.rep_works.map((w) => (
            <span
              key={w}
              className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-foreground/75"
            >
              {w}
            </span>
          ))}
        </div>
      ) : null}

      {/* 트랙 라이브러리 (가로 스크롤) */}
      {artist.tracks && artist.tracks.length > 0 ? (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground/70">
            <Play className="size-3 fill-current" />
            이 장소와 어울리는 곡
          </p>
          <ul
            className="flex gap-2.5 overflow-x-auto pb-1.5 -mx-3.5 px-3.5 snap-x snap-mandatory"
            role="list"
          >
            {artist.tracks.map((t) => (
              <li key={t.id} className="snap-start shrink-0">
                <a
                  href={t.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t.title} — YouTube`}
                  className="group block w-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ksm rounded-xl"
                >
                  <div className="relative">
                    <TrackCover track={t} artist={artist} size="md" />
                    <span
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100"
                    >
                      <Play className="size-6 fill-white text-white drop-shadow" />
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[10.5px] font-medium leading-tight text-foreground">
                    {t.title}
                  </p>
                  {t.title_ko && t.title_ko !== t.title ? (
                    <p className="line-clamp-1 text-[9.5px] text-muted-foreground">
                      〈{t.title_ko}〉
                    </p>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* 공식 영상 (16:9) */}
      {artist.featured_videos && artist.featured_videos.length > 0 ? (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground/70">
            <Youtube className="size-3" />
            공식 영상
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {artist.featured_videos.map((v) => (
              <a
                key={v.id}
                href={v.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${v.title} — YouTube`}
                className="group flex flex-col gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ksm rounded-lg"
              >
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={v.thumbnail_url}
                    alt={v.title}
                    fill
                    sizes="(max-width: 640px) 45vw, 320px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/45 via-transparent to-transparent"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md transition-transform group-hover:scale-110">
                      <Play className="size-4 translate-x-px fill-current" />
                    </span>
                  </span>
                  {v.kind ? (
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-white">
                      {videoKindLabel(v.kind)}
                    </span>
                  ) : null}
                </div>
                <p className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground/85 group-hover:text-foreground">
                  {v.title}
                </p>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function videoKindLabel(kind: NonNullable<SpotArtist["featured_videos"]>[number]["kind"]): string {
  switch (kind) {
    case "mv":
      return "MV";
    case "stage":
      return "Stage";
    case "interview":
      return "Interview";
    case "vlog":
      return "Vlog";
    default:
      return "";
  }
}

function LinkChips({ artist }: { artist: SpotArtist }) {
  const chips: Array<{
    href: string;
    label: string;
    icon: React.ReactNode;
    accent?: string;
  }> = [];

  if (artist.official_site_url) {
    chips.push({
      href: artist.official_site_url,
      label: "공식 사이트",
      icon: <Globe className="size-3.5" />,
    });
  }
  if (artist.youtube_channel_url) {
    chips.push({
      href: artist.youtube_channel_url,
      label: "YouTube",
      icon: <Youtube className="size-3.5" />,
      accent: "text-red-600 dark:text-red-400",
    });
  }
  if (artist.instagram_url) {
    chips.push({
      href: artist.instagram_url,
      label: "Instagram",
      icon: <Instagram className="size-3.5" />,
      accent: "text-pink-600 dark:text-pink-400",
    });
  }
  if (artist.agency_url) {
    chips.push({
      href: artist.agency_url,
      label: "소속사",
      icon: <Building2 className="size-3.5" />,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <a
          key={c.label}
          href={c.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground/85 transition-colors",
            "hover:border-foreground/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ksm",
          )}
        >
          <span className={c.accent}>{c.icon}</span>
          {c.label}
          <ExternalLink className="size-2.5 opacity-50" aria-hidden />
        </a>
      ))}
    </div>
  );
}

function ArtistDot({ artist, active }: { artist: SpotArtist; active: boolean }) {
  if (artist.avatar_url) {
    return (
      <span className="relative inline-block size-3.5 overflow-hidden rounded-full ring-1 ring-white/40">
        <Image src={artist.avatar_url} alt="" fill sizes="14px" className="object-cover" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-block size-2 rounded-full",
        active ? "bg-current opacity-60" : artist.accent_class ?? "bg-foreground",
      )}
      aria-hidden
    />
  );
}

function ArtistAvatar({ artist, size = 48 }: { artist: SpotArtist; size?: number }) {
  const dim = `${size}px`;
  const fontSize = size <= 32 ? 11 : size <= 44 ? 13 : 14;

  if (artist.avatar_url) {
    return (
      <span
        className="relative inline-flex shrink-0 overflow-hidden rounded-full ring-2 ring-bg-card"
        style={{ width: dim, height: dim }}
        aria-label={artist.name}
      >
        <Image src={artist.avatar_url} alt={artist.name} fill sizes={`${size}px`} className="object-cover" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full ring-2 ring-bg-card font-bold tracking-tight",
        artist.accent_class ?? "bg-foreground text-background",
      )}
      style={{ width: dim, height: dim, fontSize: `${fontSize}px` }}
      aria-label={artist.name}
    >
      {artist.initials}
    </span>
  );
}
