"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { GuardianProfile } from "@/types/domain";
import { CoverCropPreview } from "@/components/media/cover-crop-preview";
import { guardianProfileImageUrls } from "@/lib/guardian-profile-images";
import { FILL_IMAGE_GUARDIAN_INTRO_GALLERY_ITEM, FILL_IMAGE_POST_THUMB_SQUARE } from "@/lib/ui/fill-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";

export function AdminGuardianMediaClient({
  guardian,
  initialIntroUrls,
  allGalleries,
}: {
  guardian: GuardianProfile;
  initialIntroUrls: string[];
  allGalleries: Record<string, string[]>;
}) {
  const router = useRouter();
  const t = useTranslations("GuardianProfileImages");
  const imgs = useMemo(() => guardianProfileImageUrls(guardian), [guardian]);
  const [urls, setUrls] = useState<string[]>(initialIntroUrls.length ? initialIntroUrls : [""]);
  const [status, setStatus] = useState<"idle" | "saving" | "err">("idle");
  const [err, setErr] = useState<string | null>(null);
  const firstIntroUrl = useMemo(() => urls.map((x) => x.trim()).find(Boolean) ?? "", [urls]);

  function setAt(i: number, v: string) {
    setUrls((prev) => prev.map((x, j) => (j === i ? v : x)));
  }

  function addRow() {
    setUrls((prev) => [...prev, ""]);
  }

  function removeRow(i: number) {
    setUrls((prev) => prev.filter((_, j) => j !== i));
  }

  function move(i: number, dir: -1 | 1) {
    setUrls((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }

  async function save() {
    setStatus("saving");
    setErr(null);
    const cleaned = urls.map((u) => u.trim()).filter(Boolean);
    const next: Record<string, string[]> = { ...allGalleries, [guardian.user_id]: cleaned };
    try {
      const res = await fetch("/api/admin/guardian-intro-gallery", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleries: next }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "save failed");
      }
      router.refresh();
      setStatus("idle");
    } catch (e) {
      setStatus("err");
      setErr(e instanceof Error ? e.message : "error");
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-text-strong text-2xl font-semibold">{guardian.display_name}</h1>
        <p className="text-muted-foreground mt-1 font-mono text-sm">{guardian.user_id}</p>
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-foreground text-base font-semibold">이미지 용도 (현재 해석)</h2>
        <p className="text-muted-foreground text-xs leading-relaxed">{t("sectionCropExplain")}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          아래는 시드·오버라이드가 합쳐진 <strong>실제 공개 URL</strong>입니다. 아바타·목록·히어로 오버라이드는 가디언 계정의 프로필 이미지 설정 또는 DB 필드에서
          바꿉니다.
        </p>
        <dl className="grid gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground font-medium">아바타 이미지</dt>
            <dd className="text-foreground mt-1 break-all font-mono text-xs">{imgs.avatar || "—"}</dd>
            <dd className="text-muted-foreground mt-1 text-xs">헤더·작은 썸네일·상세 상단 원형 프로필 — {t("avatarHelp")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">목록 카드 이미지</dt>
            <dd className="text-foreground mt-1 break-all font-mono text-xs">{imgs.default || "—"}</dd>
            <dd className="text-muted-foreground mt-1 text-xs">{t("listHelp")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">상세 대표 이미지 (가로형 히어로)</dt>
            <dd className="text-foreground mt-1 break-all font-mono text-xs">{imgs.landscape || "—"}</dd>
            <dd className="text-muted-foreground mt-1 text-xs">
              {t("detailHelp")} 세로 전용 시드(`profile_XX.jpg`)는 히어로에 쓰지 않습니다.
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <div>
          <h2 className="text-foreground text-base font-semibold">소개 사진 갤러리 (공개 상세 본문)</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            「이 가디언을 소개합니다」 바로 아래에 표시됩니다. 히어로와 같은 URL은 상세에서 자동으로 빼고 보여 줍니다. `/public` 기준 경로(예:{" "}
            <code className="text-xs">/mock/posts/…</code>)를 넣으세요.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t("introGalleryHelp")}</p>
        </div>
        {firstIntroUrl ? (
          <CoverCropPreview
            src={firstIntroUrl}
            containerClassName="aspect-[4/3] w-full max-w-md"
            imgClassName={FILL_IMAGE_GUARDIAN_INTRO_GALLERY_ITEM}
            emptyLabel={t("previewEmpty")}
            caption={t("introGalleryPreviewCaption")}
            safeFrame
          />
        ) : null}
        <div className="space-y-3">
          {urls.map((u, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Label className="sr-only" htmlFor={`intro-${i}`}>
                URL {i + 1}
              </Label>
              <div
                className="border-border/60 relative h-11 w-14 shrink-0 overflow-hidden rounded border bg-muted"
                aria-hidden={!u.trim()}
              >
                {u.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary URLs
                  <img src={u.trim()} alt="" className={`size-full ${FILL_IMAGE_POST_THUMB_SQUARE}`} />
                ) : null}
              </div>
              <Input
                id={`intro-${i}`}
                value={u}
                onChange={(e) => setAt(i, e.target.value)}
                placeholder="/mock/posts/광화문_008.jpg"
                className="min-w-[12rem] flex-1 font-mono text-sm"
              />
              <div className="flex gap-1">
                <Button type="button" size="icon" variant="outline" className="size-9 shrink-0" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="size-4" />
                </Button>
                <Button type="button" size="icon" variant="outline" className="size-9 shrink-0" onClick={() => move(i, 1)} disabled={i === urls.length - 1}>
                  <ArrowDown className="size-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="size-9 shrink-0 text-destructive" onClick={() => removeRow(i)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" />
            URL 추가
          </Button>
          <Button type="button" onClick={() => void save()} disabled={status === "saving"}>
            {status === "saving" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                저장 중…
              </>
            ) : (
              "소개 갤러리 저장"
            )}
          </Button>
        </div>
        {status === "err" ? <p className="text-destructive text-sm">{err}</p> : null}
      </section>
    </div>
  );
}
