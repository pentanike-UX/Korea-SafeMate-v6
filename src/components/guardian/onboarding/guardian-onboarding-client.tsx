"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

const STEPS = 3;

const THEMES = [
  { id: "k_drama_romance", label: "K-drama mood / K-드라마 무드" },
  { id: "k_pop_day", label: "K-pop day / K-Pop 데이" },
  { id: "seoul_night", label: "Night Seoul / 나이트 서울" },
  { id: "photo_route", label: "Photo route / 포토 루트" },
];

const LANGS = [
  { id: "en", label: "English" },
  { id: "ko", label: "Korean" },
  { id: "ja", label: "Japanese" },
  { id: "es", label: "Spanish" },
];

export function GuardianOnboardingClient() {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [tagline, setTagline] = useState("");
  const [area, setArea] = useState("gwanghwamun");
  const [years, setYears] = useState("3");
  const [langs, setLangs] = useState<string[]>(["en", "ko"]);
  const [expertise, setExpertise] = useState("");
  const [themes, setThemes] = useState<string[]>([]);
  const [idNote, setIdNote] = useState("");
  const [routePitch, setRoutePitch] = useState("");
  const [sampleTitle, setSampleTitle] = useState("");
  const [sampleBody, setSampleBody] = useState("");

  function toggleLang(id: string) {
    setLangs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleTheme(id: string) {
    setThemes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const canNext =
    step === 0 ? displayName.trim().length > 1 && tagline.trim().length > 3 : step === 1 ? langs.length > 0 : true;

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <div className="mb-8">
        <p className="text-primary inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase">
          <Sparkles className="size-3.5" aria-hidden />
          Guardian onboarding
        </p>
        <h1 className="text-text-strong mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          프로필을 완성하고 여행자에게 보여줄 신뢰를 쌓으세요
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          세 단계로 기본 정보, 전문성, 검증·콘텐츠 초안을 정리합니다. (MVP: 저장은 로컬 미리보기용)
        </p>
      </div>

      <div className="mb-8 flex justify-center gap-2">
        {Array.from({ length: STEPS }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => i < step && setStep(i)}
            className={cn(
              "flex size-9 items-center justify-center rounded-full text-xs font-semibold transition-colors",
              i === step
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-brand)]"
                : i < step
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {i < step ? <Check className="size-4" /> : i + 1}
          </button>
        ))}
      </div>

      <Card className="border-border/60 rounded-2xl shadow-[var(--shadow-md)]">
        {step === 0 ? (
          <>
            <CardHeader>
              <CardTitle>Step 1 · 기본 프로필</CardTitle>
              <CardDescription>여행자가 처음 보는 이름과 한 줄 포지셔닝입니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="on-name">Display name · 표시 이름</Label>
                <Input
                  id="on-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Minseo K."
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="on-tag">One-line intro · 한 줄 소개</Label>
                <Input
                  id="on-tag"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Gwanghwamun walks · EN/JP"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Primary launch area · 주력 런칭 지역</Label>
                <div className="flex flex-wrap gap-2">
                  {(["gwanghwamun", "gangnam"] as const).map((a) => (
                    <Button
                      key={a}
                      type="button"
                      size="sm"
                      variant={area === a ? "default" : "outline"}
                      className="rounded-full capitalize"
                      onClick={() => setArea(a)}
                    >
                      {a}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="on-years">Years in Seoul · 서울 거주/활동</Label>
                <Input
                  id="on-years"
                  type="number"
                  min={0}
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <CardHeader>
              <CardTitle>Step 2 · 언어 & 전문 테마</CardTitle>
              <CardDescription>매칭과 포스트에 쓰이는 신호입니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Languages · 사용 언어</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGS.map((l) => (
                    <Button
                      key={l.id}
                      type="button"
                      size="sm"
                      variant={langs.includes(l.id) ? "default" : "outline"}
                      className="rounded-full text-xs"
                      onClick={() => toggleLang(l.id)}
                    >
                      {l.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="on-exp">Expertise tags · 전문 태그 (쉼표로 구분)</Label>
                <Input
                  id="on-exp"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  placeholder="Palace routes, Night cafés, Tax refund"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Experience themes · 경험 테마</Label>
                <div className="flex flex-wrap gap-2">
                  {THEMES.map((th) => (
                    <Button
                      key={th.id}
                      type="button"
                      size="sm"
                      variant={themes.includes(th.id) ? "default" : "outline"}
                      className="h-auto rounded-full px-3 py-1.5 text-xs font-normal whitespace-normal text-left"
                      onClick={() => toggleTheme(th.id)}
                    >
                      {th.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <CardHeader>
              <CardTitle>Step 3 · 검증 & 대표 콘텐츠</CardTitle>
              <CardDescription>운영 검토와 여행자 전환에 쓰일 자료입니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="on-id">ID / verification note · 신분·검증 메모</Label>
                <Textarea
                  id="on-id"
                  value={idNote}
                  onChange={(e) => setIdNote(e.target.value)}
                  placeholder="업로드는 곧 연결됩니다. 임시로 메모만 남겨 주세요."
                  className="min-h-[88px] rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="on-route">Signature route · 대표 추천 루트</Label>
                <Textarea
                  id="on-route"
                  value={routePitch}
                  onChange={(e) => setRoutePitch(e.target.value)}
                  placeholder="시간대, 이동 거리, 휴식 포인트를 짧게."
                  className="min-h-[100px] rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="on-post-t">Sample post title · 샘플 포스트 제목</Label>
                <Input
                  id="on-post-t"
                  value={sampleTitle}
                  onChange={(e) => setSampleTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="on-post-b">Sample post body · 본문 초안</Label>
                <Textarea
                  id="on-post-b"
                  value={sampleBody}
                  onChange={(e) => setSampleBody(e.target.value)}
                  className="min-h-[120px] rounded-xl"
                />
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                포스트는 블로그가 아니라 <strong className="text-foreground font-medium">신뢰·전환용 인사이트</strong>로
                쓰입니다. 실행 팁과 범위를 분명히 적어 주세요.
              </p>
            </CardContent>
          </>
        ) : null}
      </Card>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" className="rounded-xl" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ArrowLeft className="size-4" />
          이전
        </Button>
        {step < STEPS - 1 ? (
          <Button type="button" className="rounded-xl" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            다음
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" className="rounded-xl" asChild>
            <Link href="/guardian">허브로 이동</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
