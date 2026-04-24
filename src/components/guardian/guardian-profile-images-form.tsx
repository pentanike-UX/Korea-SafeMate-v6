"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CoverCropPreview } from "@/components/media/cover-crop-preview";
import {
  guardianProfileImageUrls,
  GUARDIAN_AVATAR_COVER_CLASS,
  GUARDIAN_LIST_CARD_COVER_CLASS,
  GUARDIAN_PROFILE_HERO_COVER_CLASS,
  type GuardianImageSource,
} from "@/lib/guardian-profile-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Initial = {
  photo_url: string | null;
  avatar_image_url: string | null;
  list_card_image_url: string | null;
  detail_hero_image_url: string | null;
};

export function GuardianProfileImagesForm({ userId, initial }: { userId: string; initial: Initial }) {
  const t = useTranslations("GuardianProfileImages");
  const [avatar, setAvatar] = useState(initial.avatar_image_url?.trim() ?? "");
  const [listCard, setListCard] = useState(initial.list_card_image_url?.trim() ?? "");
  const [detailHero, setDetailHero] = useState(initial.detail_hero_image_url?.trim() ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const previewModel: GuardianImageSource = useMemo(
    () => ({
      user_id: userId,
      photo_url: initial.photo_url,
      avatar_image_url: avatar || null,
      list_card_image_url: listCard || null,
      detail_hero_image_url: detailHero || null,
    }),
    [userId, initial.photo_url, avatar, listCard, detailHero],
  );

  const imgs = guardianProfileImageUrls(previewModel);

  const save = async () => {
    setStatus("saving");
    setErrMsg(null);
    try {
      const res = await fetch("/api/guardian/profile-images", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar_image_url: avatar.trim() || null,
          list_card_image_url: listCard.trim() || null,
          detail_hero_image_url: detailHero.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "save failed");
      }
      setStatus("ok");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e) {
      setStatus("err");
      setErrMsg(e instanceof Error ? e.message : "error");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-text-strong text-lg font-semibold tracking-tight">{t("sectionTitle")}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t("sectionLead")}</p>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t("sectionCropExplain")}</p>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{t("hintStorage")}</p>
        <p className="text-muted-foreground mt-2 text-[11px] leading-snug">{t("previewFootnoteCommon")}</p>
      </div>

      <div className="grid gap-8">
        <div className="space-y-3">
          <div>
            <h3 className="text-foreground text-base font-semibold">{t("avatarTitle")}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{t("avatarHelp")}</p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <CoverCropPreview
              src={imgs.avatar}
              containerClassName="size-28 shrink-0 sm:size-32"
              imgClassName={GUARDIAN_AVATAR_COVER_CLASS}
              emptyLabel={t("previewEmpty")}
              roundedFull
              safeFrame
            />
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="gp-avatar-url">{t("urlLabel")}</Label>
              <Input
                id="gp-avatar-url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder={t("urlPlaceholder")}
                className="font-mono text-sm"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-foreground text-base font-semibold">{t("listTitle")}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{t("listHelp")}</p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <CoverCropPreview
              src={imgs.default}
              containerClassName="h-[9.5rem] w-[7.25rem] shrink-0"
              imgClassName={GUARDIAN_LIST_CARD_COVER_CLASS}
              emptyLabel={t("previewEmpty")}
              caption={t("listPreviewCaption")}
              safeFrame
            />
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="gp-list-url">{t("urlLabel")}</Label>
              <Input
                id="gp-list-url"
                value={listCard}
                onChange={(e) => setListCard(e.target.value)}
                placeholder={t("urlPlaceholder")}
                className="font-mono text-sm"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-foreground text-base font-semibold">{t("detailTitle")}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{t("detailHelp")}</p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <CoverCropPreview
              src={imgs.landscape}
              containerClassName="aspect-[21/9] w-full max-w-xl shrink-0"
              imgClassName={GUARDIAN_PROFILE_HERO_COVER_CLASS}
              emptyLabel={t("previewEmpty")}
              caption={t("detailPreviewCaption")}
              safeFrame
            />
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="gp-detail-url">{t("urlLabel")}</Label>
              <Input
                id="gp-detail-url"
                value={detailHero}
                onChange={(e) => setDetailHero(e.target.value)}
                placeholder={t("urlPlaceholder")}
                className="font-mono text-sm"
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" className="h-11 rounded-xl font-semibold" disabled={status === "saving"} onClick={() => void save()}>
          {status === "saving" ? t("saving") : t("save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl"
          disabled={status === "saving"}
          onClick={() => {
            setAvatar("");
            setListCard("");
            setDetailHero("");
          }}
        >
          {t("clearAll")}
        </Button>
        {status === "ok" ? <span className="text-muted-foreground text-sm">{t("saved")}</span> : null}
        {status === "err" ? <span className="text-destructive text-sm">{errMsg || t("error")}</span> : null}
      </div>
    </div>
  );
}
