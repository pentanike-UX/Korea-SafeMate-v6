"use client";

import { cn } from "@/lib/utils";
import type { SpotArtist } from "@/types/haru";

/**
 * 스팟 카드에 얹는 미니 앨범커버 스택 (A 패턴).
 * - 최대 3장이 살짝 겹쳐서 회전한 채로 떠다님 → "이 장소엔 곡이 있다"는 시각 시그널
 * - 외부 이미지에 의존하지 않도록 아티스트 accent_class 그라데이션 + 트랙 이니셜
 * - 클릭 핸들러는 부모(SpotCard)가 카드 전체 onClick으로 위임
 */
export function SpotCoverStack({
  artists,
  className,
}: {
  artists: SpotArtist[] | undefined;
  className?: string;
}) {
  const tracks = collectCovers(artists, 3);
  if (tracks.length === 0) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute right-3 bottom-3 flex items-center",
        className,
      )}
    >
      {tracks.map((t, i) => (
        <span
          key={t.key}
          className={cn(
            "relative inline-flex size-10 items-center justify-center overflow-hidden rounded-md text-[10px] font-bold leading-none text-white",
            "shadow-[0_4px_10px_-2px_rgba(0,0,0,0.35)] ring-2 ring-white/90",
            t.accent ?? "bg-violet-600",
            i === 0 ? "" : "-ml-3.5",
          )}
          style={{
            transform: `rotate(${(i - 1) * 6}deg)`,
            zIndex: 10 - i,
          }}
        >
          <span className="px-0.5 text-center leading-tight line-clamp-2">
            {t.label}
          </span>
        </span>
      ))}
      {tracks.length > 0 ? (
        <span className="ml-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
          ♪
        </span>
      ) : null}
    </div>
  );
}

function collectCovers(
  artists: SpotArtist[] | undefined,
  max: number,
): Array<{ key: string; label: string; accent?: string }> {
  if (!artists?.length) return [];
  const out: Array<{ key: string; label: string; accent?: string }> = [];
  for (const a of artists) {
    if (!a.tracks?.length) continue;
    for (const t of a.tracks) {
      out.push({
        key: `${a.id}-${t.id}`,
        label: shortLabel(t.title_ko ?? t.title),
        accent: a.accent_class,
      });
      if (out.length >= max) return out;
    }
  }
  return out;
}

/** 미니 커버에 들어갈 1~4자 짧은 라벨 */
function shortLabel(title: string): string {
  const cleaned = title.replace(/[〈〉()]/g, "").trim();
  if (cleaned.length <= 4) return cleaned;
  // 첫 단어가 짧으면 그대로, 아니면 앞 3자
  const firstWord = cleaned.split(/\s+/)[0] ?? cleaned;
  if (firstWord.length <= 4) return firstWord;
  return cleaned.slice(0, 3);
}
