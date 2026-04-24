"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";

/** 프로필 사진 변경 UI: 파일 선택까지 연결, 업로드 파이프라인은 추후 Storage 연동 */
export function MypageAvatarEditTrigger({ className }: { className?: string }) {
  const t = useTranslations("TravelerHub");
  const inputRef = useRef<HTMLInputElement>(null);
  const [hint, setHint] = useState<string | null>(null);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={() => {
          setHint(t("hubChangePhotoHint"));
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        className="border-background/80 size-9 shrink-0 rounded-full border-2 shadow-md"
        aria-label={t("hubChangePhoto")}
        onClick={() => inputRef.current?.click()}
      >
        <Camera className="size-4" aria-hidden />
      </Button>
      {hint ? <p className="text-muted-foreground max-w-[14rem] text-center text-[11px] leading-snug">{hint}</p> : null}
    </div>
  );
}
