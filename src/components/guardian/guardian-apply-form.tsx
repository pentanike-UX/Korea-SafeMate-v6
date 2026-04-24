"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function GuardianApplyForm() {
  const [open, setOpen] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO(prod): Persist `guardian_profiles` draft + document uploads to Supabase Storage.
    setOpen(true);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="border-border/60 bg-card/60 rounded-2xl border p-6 shadow-[var(--shadow-sm)] space-y-5">
        <div className="space-y-0.5">
          <p className="text-text-strong text-sm font-semibold">지원서 작성</p>
          <p className="text-muted-foreground text-xs leading-relaxed">검토 후 영업일 기준 3–5일 내 이메일로 안내드립니다.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="g-name">실명</Label>
            <Input id="g-name" required placeholder="법적 성명을 입력해 주세요" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="g-display">활동명</Label>
            <Input id="g-display" required placeholder="프로필에 표시될 이름" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="g-email">이메일</Label>
          <Input id="g-email" type="email" required autoComplete="email" placeholder="연락받을 이메일 주소" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="g-lang">지원 가능 언어</Label>
          <Input
            id="g-lang"
            required
            placeholder="예: 한국어, 영어, 일본어"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="g-bio">소개 및 경험</Label>
          <Textarea
            id="g-bio"
            rows={4}
            required
            placeholder="서울에서의 경험, 잘 아는 지역, 동행 스타일을 간략히 적어주세요"
          />
        </div>
        <label className="text-muted-foreground flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" required className="border-input text-primary mt-1 size-4 rounded" />
          <span className="whitespace-pre-line">
            저는 가디언 활동이 의료·법률·긴급 구조를 대체하지 않으며,{"\n"}
            정해진 범위 내의 실무 동행 지원임을 확인합니다.
          </span>
        </label>
        <Button type="submit" size="lg" className="w-full rounded-xl">
          지원서 제출
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
            <Button asChild className="rounded-xl">
              <Link href="/guardians">가디언 소개 보기</Link>
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
