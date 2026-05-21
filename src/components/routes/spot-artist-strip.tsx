"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SpotArtist } from "@/types/haru";

/**
 * 스팟 카드 하단의 컴팩트 아티스트 스트립.
 * - 원형 아바타 (여러 명이면 -ml-2 오버랩)
 * - 우측에 이름 / 소속사 한 줄
 *
 * 비즈니스 메모: 카드는 무료 미리보기에도 노출되므로 가벼운 시각 시그널 역할.
 * 풀 정보(대표곡 등)는 결제 후 drawer의 ArtistDetailList에서 노출.
 */
export function SpotArtistStrip({
  artists,
  className,
  /** 표시 라벨 — 기본 "관련 아티스트" */
  label = "관련 아티스트",
  compact = false,
}: {
  artists: SpotArtist[] | undefined;
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  if (!artists || artists.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2.5 border-t border-border/40 pt-2.5", className)}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </p>
      <div className="flex -space-x-2 shrink-0">
        {artists.map((a) => (
          <ArtistAvatar key={a.id} artist={a} size={compact ? 22 : 26} />
        ))}
      </div>
      <p className={cn("min-w-0 truncate text-[11px] font-medium text-foreground/85", compact && "text-[10.5px]")}>
        {artists.map((a) => a.name).join(" · ")}
      </p>
    </div>
  );
}

/** 풀 정보 리스트 — Drawer에서 노출 (소속사·대표곡까지). */
export function SpotArtistDetailList({
  artists,
  label = "관련 아티스트",
}: {
  artists: SpotArtist[] | undefined;
  label?: string;
}) {
  if (!artists || artists.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 p-3.5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <ul className="space-y-3.5">
        {artists.map((a) => (
          <li key={a.id} className="flex gap-3">
            <ArtistAvatar artist={a} size={44} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <p className="text-sm font-bold text-foreground">{a.name}</p>
                {a.name_en && a.name_en !== a.name ? (
                  <span className="text-[11px] text-muted-foreground">· {a.name_en}</span>
                ) : null}
              </div>
              {a.agency ? (
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/70">소속사 </span>
                  {a.agency}
                </p>
              ) : null}
              {a.rep_works && a.rep_works.length > 0 ? (
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground/70">대표 </span>
                  {a.rep_works.join(" · ")}
                </p>
              ) : null}
              {a.scene ? (
                <p className="text-[11px] text-foreground/75 leading-relaxed italic">
                  “{a.scene}”
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArtistAvatar({ artist, size = 26 }: { artist: SpotArtist; size?: number }) {
  const dim = `${size}px`;
  const fontSize = size <= 24 ? 9 : size <= 32 ? 10 : 13;

  if (artist.avatar_url) {
    return (
      <span
        className="relative inline-flex shrink-0 overflow-hidden rounded-full ring-2 ring-bg-card"
        style={{ width: dim, height: dim }}
        aria-label={artist.name}
      >
        <Image
          src={artist.avatar_url}
          alt={artist.name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
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
      title={artist.name}
      aria-label={artist.name}
    >
      {artist.initials}
    </span>
  );
}
