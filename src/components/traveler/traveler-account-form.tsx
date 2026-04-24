"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type TravelerAccountInitial = {
  display_name: string;
  intro: string;
  locale: string;
  preferred_region: string;
  interest_themes: string[];
  spoken_languages: string[];
  profile_note: string;
  email: string;
  login_provider: string;
  created_at: string | null;
  last_login_at: string | null;
};

function formatWhen(iso: string | null, locale: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function TravelerAccountForm({
  initial,
  locale,
}: {
  initial: TravelerAccountInitial;
  locale: string;
}) {
  const t = useTranslations("TravelerAccount");
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [intro, setIntro] = useState(initial.intro);
  const [loc, setLoc] = useState(initial.locale);
  const [preferredRegion, setPreferredRegion] = useState(initial.preferred_region);
  const [interestThemes, setInterestThemes] = useState(initial.interest_themes.join(", "));
  const [spokenLanguages, setSpokenLanguages] = useState(initial.spoken_languages.join(", "));
  const [profileNote, setProfileNote] = useState(initial.profile_note);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          display_name: displayName,
          intro,
          locale: loc,
          preferred_region: preferredRegion,
          interest_themes: interestThemes,
          spoken_languages: spokenLanguages,
          profile_note: profileNote,
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="text-lg">{t("sectionAccount")}</CardTitle>
          <CardDescription>{t("pageLead")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="acct-email">{t("fieldEmail")}</Label>
            <Input id="acct-email" value={initial.email} readOnly className="bg-muted/40" />
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t("fieldLoginMethod")}</p>
            <p className="text-sm font-medium capitalize">{initial.login_provider || "google"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t("fieldCreatedAt")}</p>
            <p className="text-sm font-medium">{formatWhen(initial.created_at, locale)}</p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t("fieldLastLogin")}</p>
            <p className="text-sm font-medium">{formatWhen(initial.last_login_at, locale)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="text-lg">{t("sectionProfile")}</CardTitle>
          <CardDescription>프로필 기본 정보와 한 줄 소개를 수정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">{t("fieldDisplayName")}</Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="intro">{t("fieldIntro")}</Label>
            <Textarea id="intro" value={intro} onChange={(e) => setIntro(e.target.value)} rows={4} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locale">{t("fieldLocale")}</Label>
            <Input id="locale" value={loc} onChange={(e) => setLoc(e.target.value)} className="rounded-xl" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-sm)]">
        <CardHeader>
          <CardTitle className="text-lg">추가정보</CardTitle>
          <CardDescription>선호 지역/관심 테마/사용 언어 등 프로필 맥락 정보를 직접 수정할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preferred_region">선호 지역</Label>
              <Input
                id="preferred_region"
                value={preferredRegion}
                onChange={(e) => setPreferredRegion(e.target.value)}
                placeholder="예: 광화문, 강남"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spoken_languages">사용 언어</Label>
              <Input
                id="spoken_languages"
                value={spokenLanguages}
                onChange={(e) => setSpokenLanguages(e.target.value)}
                placeholder="예: 한국어, English, 日本語"
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="interest_themes">관심 테마/무드</Label>
            <Input
              id="interest_themes"
              value={interestThemes}
              onChange={(e) => setInterestThemes(e.target.value)}
              placeholder="예: safe_solo, photo_route, seoul_night"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile_note">기타 프로필 정보</Label>
            <Textarea
              id="profile_note"
              value={profileNote}
              onChange={(e) => setProfileNote(e.target.value)}
              rows={3}
              placeholder="동행 스타일, 응답 시간대, 요청 시 선호 입력 방식 등"
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="submit" disabled={status === "saving"} className="rounded-xl font-semibold">
          {status === "saving" ? t("saving") : t("save")}
        </Button>
        {status === "saved" ? <span className="text-muted-foreground text-sm">{t("saved")}</span> : null}
        {status === "error" ? <span className="text-destructive text-sm">{t("error")}</span> : null}
      </div>
    </form>
  );
}
