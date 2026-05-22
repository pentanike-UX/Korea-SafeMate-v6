"use client";

import Image from "next/image";
import { Globe, Youtube, Instagram, ExternalLink, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpotArtist } from "@/types/haru";

/**
 * 시트 본문의 아티스트 섹션 — 묶인 모든 아티스트를 한 번에 카드 리스트로 노출.
 * (이전: 칩 탭으로 한 명씩 전환 → 변경: 카드 스택으로 한꺼번에 표시)
 *
 * 카드 구성 (per artist):
 *  - 헤더: 아바타 + 이름 + 소속사
 *  - 외부 링크 칩: 공식 사이트 / YouTube / Instagram / 소속사
 *  - scene 인용 (한 줄)
 *  - 트랙 가로 스크롤 (앞 스팟에서 큐레이션된 음악 요약)
 *  - 공식 영상 (16:9 두 컷, 있을 때만)
 */
export function ArtistSpotlight({
  artists,
  label = "관련 아티스트",
}: {
  artists: SpotArtist[] | undefined;
  label?: string;
}) {
  if (!artists || artists.length === 0) return null;

  return (
    <section
      aria-label={label}
      className="rounded-2xl border border-border/40 bg-card/50 p-3.5"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          🎤 {label}
        </p>
        <p className="text-[10px] text-muted-foreground">{artists.length}명</p>
      </header>

      <ul className="space-y-3">
        {artists.map((a) => (
          <li key={a.id}>
            <ArtistCard artist={a} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ArtistCard({ artist }: { artist: SpotArtist }) {
  return (
    <article className="rounded-xl border border-border/40 bg-background/60 p-4 space-y-3">
      {/* 헤더 — 아바타 크게, 이름·소속사 옆에 */}
      <div className="flex items-center gap-3.5">
        <ArtistAvatar artist={artist} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <p className="text-lg font-bold leading-tight text-foreground">{artist.name}</p>
            {artist.name_en && artist.name_en !== artist.name ? (
              <span className="text-xs text-muted-foreground">· {artist.name_en}</span>
            ) : null}
          </div>
          {artist.agency ? (
            <p className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
              <Building2 className="size-3 opacity-60" aria-hidden />
              {artist.agency}
            </p>
          ) : null}
        </div>
      </div>

      {/* 외부 링크 칩 */}
      <LinkChips artist={artist} />

      {/* scene 인용 */}
      {artist.scene ? (
        <p className="text-[12px] leading-snug italic text-foreground/75 border-l-2 border-foreground/15 pl-3">
          “{artist.scene}”
        </p>
      ) : null}
    </article>
  );
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
      icon: <Globe className="size-3" />,
    });
  }
  if (artist.youtube_channel_url) {
    chips.push({
      href: artist.youtube_channel_url,
      label: "YouTube",
      icon: <Youtube className="size-3" />,
      accent: "text-red-600 dark:text-red-400",
    });
  }
  if (artist.instagram_url) {
    chips.push({
      href: artist.instagram_url,
      label: "Instagram",
      icon: <Instagram className="size-3" />,
      accent: "text-pink-600 dark:text-pink-400",
    });
  }
  if (artist.agency_url) {
    chips.push({
      href: artist.agency_url,
      label: "소속사",
      icon: <Building2 className="size-3" />,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c) => (
        <a
          key={c.label}
          href={c.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10.5px] font-medium text-foreground/85 transition-colors",
            "hover:border-foreground/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ksm",
          )}
        >
          <span className={c.accent}>{c.icon}</span>
          {c.label}
          <ExternalLink className="size-2 opacity-50" aria-hidden />
        </a>
      ))}
    </div>
  );
}

function ArtistAvatar({ artist, size = 40 }: { artist: SpotArtist; size?: number }) {
  const dim = `${size}px`;
  const fontSize = size <= 32 ? 11 : size <= 44 ? 12 : 14;

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
