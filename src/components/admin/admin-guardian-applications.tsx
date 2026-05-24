"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw, Loader2, FileText } from "lucide-react";

export interface AdminGuardianApplication {
  id: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  real_name: string | null;
  display_name: string | null;
  contact_email: string | null;
  languages: string[] | null;
  motivation: string;
  review_note: string | null;
  residence_proof: string | null;
  sample_route: { title?: string; area?: string; stops?: Array<{ name?: string; note?: string }> } | null;
  created_at: string | null;
}

type ReviewAction = "approve" | "reject" | "request_revision";

const STATUS_LABEL: Record<AdminGuardianApplication["status"], string> = {
  pending: "검토 대기",
  approved: "승인됨",
  rejected: "반려됨",
  needs_revision: "보완 요청",
};

const STATUS_TONE: Record<AdminGuardianApplication["status"], string> = {
  pending: "bg-amber-500/15 text-amber-600",
  approved: "bg-emerald-500/15 text-emerald-600",
  rejected: "bg-rose-500/15 text-rose-600",
  needs_revision: "bg-sky-500/15 text-sky-600",
};

export function AdminGuardianApplications({ applications }: { applications: AdminGuardianApplication[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  async function review(id: string, action: ReviewAction) {
    if (action !== "approve" && !(notes[id]?.trim())) {
      setFeedback((f) => ({ ...f, [id]: "반려·보완 시 사유를 입력해 주세요." }));
      return;
    }
    setBusyId(id);
    setFeedback((f) => ({ ...f, [id]: "" }));
    try {
      const res = await fetch(`/api/admin/guardian-applications/${id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, note: notes[id]?.trim() || undefined }),
      });
      const json = (await res.json()) as { ok?: boolean; mock?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setFeedback((f) => ({ ...f, [id]: json.error ?? "실패" }));
        return;
      }
      if (json.mock) {
        setFeedback((f) => ({ ...f, [id]: "mock — service-role 미설정, DB 반영 없음" }));
        return;
      }
      router.refresh();
    } catch {
      setFeedback((f) => ({ ...f, [id]: "네트워크 오류" }));
    } finally {
      setBusyId(null);
    }
  }

  if (applications.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-border/60 bg-card/50 p-4 text-sm">
        대기 중인 지원서가 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {applications.map((a) => {
        const busy = busyId === a.id;
        return (
          <li key={a.id} className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-foreground font-semibold">{a.display_name ?? a.real_name ?? "이름 미상"}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[a.status]}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {a.real_name ? `실명 ${a.real_name} · ` : ""}
                  {a.contact_email ?? "이메일 없음"}
                  {a.languages && a.languages.length > 0 ? ` · ${a.languages.join(", ")}` : ""}
                </p>
              </div>
              {a.created_at ? (
                <p className="text-muted-foreground shrink-0 text-xs">
                  {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(a.created_at))}
                </p>
              ) : null}
            </div>

            <p className="text-foreground/90 mt-3 whitespace-pre-line text-sm leading-relaxed">{a.motivation}</p>

            {a.sample_route && (a.sample_route.title || (a.sample_route.stops?.length ?? 0) > 0) ? (
              <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                <p className="text-text-strong text-xs font-semibold">
                  샘플 코스: {a.sample_route.title ?? "(제목 없음)"}
                  {a.sample_route.area ? <span className="text-muted-foreground font-normal"> · {a.sample_route.area}</span> : null}
                </p>
                <ol className="text-muted-foreground mt-2 list-decimal space-y-0.5 pl-5 text-xs">
                  {(a.sample_route.stops ?? []).map((s, i) => (
                    <li key={i}>
                      <span className="text-foreground/90 font-medium">{s.name}</span>
                      {s.note ? ` — ${s.note}` : ""}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {a.review_note ? (
              <p className="text-muted-foreground mt-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                이전 검토 의견: {a.review_note}
              </p>
            ) : null}

            {a.residence_proof ? (
              <a
                href={`/api/admin/guardian-applications/${a.id}/document`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
              >
                <FileText className="size-4" /> 거주 증빙 문서 보기
              </a>
            ) : (
              <p className="text-muted-foreground mt-3 text-xs">거주 증빙 문서 미제출</p>
            )}

            <textarea
              value={notes[a.id] ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
              rows={2}
              placeholder="반려·보완 사유 (승인 시 선택)"
              className="border-input mt-3 w-full rounded-xl border bg-background px-3 py-2 text-sm"
            />

            {feedback[a.id] ? <p className="mt-2 text-xs font-medium text-rose-500">{feedback[a.id]}</p> : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={() => review(a.id, "approve")} className="rounded-xl">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} 승인
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => review(a.id, "request_revision")}
                className="rounded-xl"
              >
                <RotateCcw className="size-4" /> 보완 요청
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => review(a.id, "reject")}
                className="rounded-xl text-rose-600 hover:text-rose-600"
              >
                <X className="size-4" /> 반려
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
