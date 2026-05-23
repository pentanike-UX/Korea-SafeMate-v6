"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";
import { submitGuardianApplicationAction } from "@/components/guardian/guardian-apply-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function parseLanguages(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[,，、/·\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

export function GuardianApplyForm({ isAuthed = false }: { isAuthed?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [realName, setRealName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [languagesRaw, setLanguagesRaw] = useState("");
  const [motivation, setMotivation] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isAuthed) {
      router.push({ pathname: "/login", query: { next: "/guardians/apply" } });
      return;
    }

    const languages = parseLanguages(languagesRaw);
    if (languages.length === 0) {
      setError("지원 가능 언어를 1개 이상 입력해 주세요.");
      return;
    }
    if (motivation.trim().length < 10) {
      setError("소개 및 경험을 조금 더 자세히 작성해 주세요.");
      return;
    }

    startTransition(async () => {
      const res = await submitGuardianApplicationAction({
        realName: realName.trim(),
        displayName: displayName.trim(),
        contactEmail: contactEmail.trim(),
        languages,
        motivation: motivation.trim(),
      });
      if (res.ok) {
        setOpen(true);
        return;
      }
      if (res.needsLogin) {
        router.push({ pathname: "/login", query: { next: "/guardians/apply" } });
        return;
      }
      if (res.alreadyApplied) {
        setError("이미 지원서를 제출하셨습니다. 검토 결과를 기다려 주세요.");
        return;
      }
      setError(res.error ?? "제출 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    });
  }

  return (
    <>
      <form onSubmit={onSubmit} className="border-border/60 bg-card/60 rounded-2xl border p-6 shadow-[var(--shadow-sm)] space-y-5">
        <div className="space-y-0.5">
          <p className="text-text-strong text-sm font-semibold">지원서 작성</p>
          <p className="text-muted-foreground text-xs leading-relaxed">검토 후 영업일 기준 3–5일 내 이메일로 안내드립니다.</p>
        </div>
        {!isAuthed ? (
          <p className="rounded-xl bg-[var(--brand-trust-blue-soft)] px-3 py-2 text-xs leading-relaxed text-[var(--brand-trust-blue)]">
            지원서 제출에는 로그인이 필요합니다. 제출 시 로그인 화면으로 이동합니다.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="g-name">실명</Label>
            <Input
              id="g-name"
              required
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="법적 성명을 입력해 주세요"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="g-display">활동명</Label>
            <Input
              id="g-display"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="프로필에 표시될 이름"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="g-email">이메일</Label>
          <Input
            id="g-email"
            type="email"
            required
            autoComplete="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="연락받을 이메일 주소"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="g-lang">지원 가능 언어</Label>
          <Input
            id="g-lang"
            required
            value={languagesRaw}
            onChange={(e) => setLanguagesRaw(e.target.value)}
            placeholder="예: 한국어, 영어, 일본어"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="g-bio">소개 및 경험</Label>
          <Textarea
            id="g-bio"
            rows={4}
            required
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="서울에서의 경험, 잘 아는 지역, 동행 스타일을 간략히 적어주세요"
          />
        </div>
        <label className="text-muted-foreground flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" required className="border-input text-primary mt-1 size-4 rounded" />
          <span className="whitespace-pre-line">
            저는 하루이 활동이 의료·법률·긴급 구조를 대체하지 않으며,{"\n"}
            정해진 서비스 범위 안에서 여행자의 하루를 돕는 역할임을 확인합니다.
          </span>
        </label>
        {error ? <p className="text-sm font-medium text-rose-500">{error}</p> : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full rounded-xl">
          {pending ? "제출 중…" : "지원서 제출"}
        </Button>
      </form>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>지원서가 접수되었습니다</DialogTitle>
            <DialogDescription>
              검토 후 입력하신 이메일로 연락드릴게요. 보통 영업일 기준 3~5일 내에 소식을 드립니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              className="rounded-xl"
              onClick={() => {
                setOpen(false);
                router.refresh();
              }}
            >
              지원 현황 보기
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/guardians">하루이 보기</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
