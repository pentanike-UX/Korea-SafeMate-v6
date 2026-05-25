import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

export type GuardianApplicationStatusValue = "pending" | "approved" | "rejected" | "needs_revision";

interface Props {
  status: GuardianApplicationStatusValue;
  displayName: string | null;
  languages: string[] | null;
  reviewNote: string | null;
  createdAt: string | null;
}

const STATUS_META: Record<
  GuardianApplicationStatusValue,
  { label: string; desc: string; tone: string; Icon: typeof Clock }
> = {
  pending: {
    label: "검토 중",
    desc: "지원서가 접수되었습니다. 영업일 기준 3–5일 내 이메일로 결과를 안내드립니다.",
    tone: "text-[var(--brand-trust-blue)]",
    Icon: Clock,
  },
  approved: {
    label: "승인됨",
    desc: "축하합니다! 하루이로 승인되었습니다. 이제 하루웨이를 만들고 요청에 응답할 수 있습니다.",
    tone: "text-emerald-500",
    Icon: CheckCircle2,
  },
  needs_revision: {
    label: "보완 요청",
    desc: "검토 결과 보완이 필요합니다. 아래 안내를 확인하고 다시 연락드린 방법으로 보완해 주세요.",
    tone: "text-amber-500",
    Icon: AlertCircle,
  },
  rejected: {
    label: "승인 보류",
    desc: "이번에는 승인되지 않았습니다. 자세한 사유는 아래를 확인해 주세요.",
    tone: "text-rose-500",
    Icon: XCircle,
  },
};

export function GuardianApplicationStatus({ status, displayName, languages, reviewNote, createdAt }: Props) {
  const meta = STATUS_META[status];
  const { Icon } = meta;
  const submitted = createdAt
    ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date(createdAt))
    : null;

  return (
    <section
      aria-label="하루이 지원 현황"
      className="border-border/60 bg-card/60 rounded-2xl border p-6 shadow-[var(--shadow-sm)] space-y-5"
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 size-6 shrink-0 ${meta.tone}`} strokeWidth={1.75} aria-hidden />
        <div className="space-y-1">
          <p className="text-text-strong text-base font-semibold">지원 현황: {meta.label}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">{meta.desc}</p>
        </div>
      </div>

      <dl className="space-y-2 rounded-xl bg-muted/40 p-4 text-sm">
        {displayName ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">활동명</dt>
            <dd className="text-text-strong font-medium">{displayName}</dd>
          </div>
        ) : null}
        {languages && languages.length > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">언어</dt>
            <dd className="text-text-strong font-medium">{languages.join(", ")}</dd>
          </div>
        ) : null}
        {submitted ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">제출일</dt>
            <dd className="text-text-strong font-medium">{submitted}</dd>
          </div>
        ) : null}
      </dl>

      {reviewNote && (status === "rejected" || status === "needs_revision") ? (
        <div className="rounded-xl border border-border/60 p-4">
          <p className="text-text-strong mb-1 text-xs font-semibold uppercase tracking-wide">검토 의견</p>
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{reviewNote}</p>
        </div>
      ) : null}

      {status === "approved" ? (
        <Button asChild className="w-full rounded-xl">
          <Link href="/mypage/guardian/posts">하루이 워크스페이스로</Link>
        </Button>
      ) : (
        <Button asChild variant="outline" className="w-full rounded-xl">
          <Link href="/guardians">하루이 둘러보기</Link>
        </Button>
      )}
    </section>
  );
}
