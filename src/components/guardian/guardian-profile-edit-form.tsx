"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CoverCropPreview } from "@/components/media/cover-crop-preview";
import { FILL_IMAGE_GUARDIAN_INTRO_GALLERY_ITEM } from "@/lib/ui/fill-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GuardianProfileImagesForm } from "@/components/guardian/guardian-profile-images-form";

type LanguageRow = {
  language_code: string;
  proficiency: "basic" | "conversational" | "fluent" | "native";
};

export type GuardianProfileEditInitial = {
  user_id: string;
  display_name: string;
  headline: string;
  bio: string;
  primary_region_slug: string;
  expertise_tags: string[];
  theme_slugs: string[];
  style_slugs: string[];
  trust_reasons: string[];
  intro_gallery_image_urls: string[];
  languages: LanguageRow[];
  photo_url: string | null;
  avatar_image_url: string | null;
  list_card_image_url: string | null;
  detail_hero_image_url: string | null;
};

export function GuardianProfileEditForm({ initial }: { initial: GuardianProfileEditInitial }) {
  const tImg = useTranslations("GuardianProfileImages");
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [headline, setHeadline] = useState(initial.headline);
  const [bio, setBio] = useState(initial.bio);
  const [region, setRegion] = useState(initial.primary_region_slug);
  const [langs, setLangs] = useState(initial.languages.map((l) => `${l.language_code}:${l.proficiency}`).join(", "));
  const [expertise, setExpertise] = useState(initial.expertise_tags.join(", "));
  const [themes, setThemes] = useState(initial.theme_slugs.join(", "));
  const [styles, setStyles] = useState(initial.style_slugs.join(", "));
  const [trustReasons, setTrustReasons] = useState(initial.trust_reasons.join(", "));
  const [gallery, setGallery] = useState(initial.intro_gallery_image_urls.join("\n"));
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const firstGalleryUrl = useMemo(
    () => gallery.split("\n").map((x) => x.trim()).find(Boolean) ?? "",
    [gallery],
  );

  const parseLanguages = () =>
    langs
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => {
        const [code, prof] = x.split(":");
        const p = prof?.trim();
        return {
          language_code: code?.trim() || "",
          proficiency: p === "basic" || p === "conversational" || p === "fluent" || p === "native" ? p : "conversational",
        } as LanguageRow;
      })
      .filter((x) => x.language_code);

  async function onSave() {
    setStatus("saving");
    try {
      const res = await fetch("/api/guardian/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          headline,
          bio,
          primary_region_slug: region,
          languages: parseLanguages(),
          expertise_tags: expertise,
          theme_slugs: themes,
          style_slugs: styles,
          trust_reasons: trustReasons,
          intro_gallery_image_urls: gallery
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setStatus("ok");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("err");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
          <CardDescription>이름/한 줄 소개/활동 지역/언어를 수정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gp-display-name">이름</Label>
            <Input id="gp-display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gp-headline">한 줄 소개</Label>
            <Input id="gp-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gp-region">활동 지역(slug)</Label>
            <Input id="gp-region" value={region} onChange={(e) => setRegion(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gp-langs">언어(code:proficiency, ...)</Label>
            <Input
              id="gp-langs"
              value={langs}
              onChange={(e) => setLangs(e.target.value)}
              placeholder="ko:native, en:fluent"
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="text-lg">상세 소개</CardTitle>
          <CardDescription>상세 소개/강점/신뢰 근거를 수정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gp-bio">상세 소개</Label>
            <Textarea id="gp-bio" rows={5} value={bio} onChange={(e) => setBio(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gp-expertise">잘하는 경험(콤마 구분)</Label>
            <Input id="gp-expertise" value={expertise} onChange={(e) => setExpertise(e.target.value)} className="rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gp-themes">대표 테마(콤마 구분)</Label>
              <Input id="gp-themes" value={themes} onChange={(e) => setThemes(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gp-styles">대표 스타일(콤마 구분)</Label>
              <Input id="gp-styles" value={styles} onChange={(e) => setStyles(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gp-trust">믿고 선택할 수 있는 이유(콤마 구분)</Label>
            <Input id="gp-trust" value={trustReasons} onChange={(e) => setTrustReasons(e.target.value)} className="rounded-xl" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="text-lg">공개 프로필 요소</CardTitle>
          <CardDescription>소개 사진 갤러리 URL을 줄바꿈으로 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm leading-relaxed">{tImg("introGalleryHelp")}</p>
            <Label htmlFor="gp-gallery">소개 사진 갤러리(URL, 줄바꿈)</Label>
            <Textarea
              id="gp-gallery"
              rows={4}
              value={gallery}
              onChange={(e) => setGallery(e.target.value)}
              placeholder="https://...\nhttps://..."
              className="font-mono text-sm rounded-xl"
            />
            {firstGalleryUrl ? (
              <div className="pt-1">
                <CoverCropPreview
                  src={firstGalleryUrl}
                  containerClassName="aspect-[4/3] w-full max-w-[17.5rem]"
                  imgClassName={FILL_IMAGE_GUARDIAN_INTRO_GALLERY_ITEM}
                  emptyLabel={tImg("previewEmpty")}
                  caption={tImg("introGalleryPreviewCaption")}
                  safeFrame
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="text-lg">이미지 관리</CardTitle>
          <CardDescription>아바타/카드/상세 이미지 3종을 용도별로 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <GuardianProfileImagesForm
            userId={initial.user_id}
            initial={{
              photo_url: initial.photo_url,
              avatar_image_url: initial.avatar_image_url,
              list_card_image_url: initial.list_card_image_url,
              detail_hero_image_url: initial.detail_hero_image_url,
            }}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" className="rounded-xl font-semibold" onClick={() => void onSave()} disabled={status === "saving"}>
          {status === "saving" ? "저장 중..." : "저장"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            setDisplayName(initial.display_name);
            setHeadline(initial.headline);
            setBio(initial.bio);
            setRegion(initial.primary_region_slug);
            setLangs(initial.languages.map((l) => `${l.language_code}:${l.proficiency}`).join(", "));
            setExpertise(initial.expertise_tags.join(", "));
            setThemes(initial.theme_slugs.join(", "));
            setStyles(initial.style_slugs.join(", "));
            setTrustReasons(initial.trust_reasons.join(", "));
            setGallery(initial.intro_gallery_image_urls.join("\n"));
          }}
        >
          취소
        </Button>
        {status === "ok" ? <span className="text-muted-foreground text-sm">저장되었습니다.</span> : null}
        {status === "err" ? <span className="text-destructive text-sm">저장 실패</span> : null}
      </div>
    </div>
  );
}
