import { cn } from "@/lib/utils";

/**
 * Logo — KSM 브랜드 로고
 * variant="mark"   → 아이콘 마크만 (네비 등 좁은 공간)
 * variant="full"   → 마크 + 워드마크 (헤더, 랜딩)
 * variant="word"   → 워드마크만 (텍스트 전용)
 *
 * TODO: SVG 마크는 실제 브랜드 에셋으로 교체 예정
 */

type LogoVariant = "mark" | "full" | "word";
type LogoTheme = "default" | "onDark";

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  className?: string;
  /** 마크 크기 (px). full/mark variant에 적용 */
  size?: number;
}

export function Logo({ variant = "full", theme = "default", className, size = 32 }: LogoProps) {
  const onDark = theme === "onDark";

  return (
    <span
      className={cn("inline-flex items-center gap-2 select-none", className)}
      aria-label="Korea SafeMate"
    >
      {/* Mark — 임시 SVG 마크 (실제 로고 에셋 교체 전) */}
      {variant !== "word" && (
        <LogoMark size={size} onDark={onDark} />
      )}

      {/* Wordmark */}
      {variant !== "mark" && (
        <span
          className={cn(
            "font-serif font-semibold tracking-tight leading-none",
            size >= 32 ? "text-xl" : "text-base",
            onDark ? "text-white" : "text-ink",
          )}
        >
          SafeMate
        </span>
      )}
    </span>
  );
}

function LogoMark({ size, onDark }: { size: number; onDark: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* 임시 마크: 둥근 사각형 + S 이니셜 — 실제 브랜드 에셋으로 교체 예정 */}
      <rect
        width="32"
        height="32"
        rx="8"
        fill={onDark ? "rgba(255,255,255,0.15)" : "var(--ink)"}
      />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fontFamily="var(--font-serif), Georgia, serif"
        fontSize="17"
        fontWeight="700"
        fill={onDark ? "white" : "var(--bg)"}
      >
        S
      </text>
    </svg>
  );
}
