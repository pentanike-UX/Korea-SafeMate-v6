import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { mockTravelerTripRequests } from "@/data/mock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ id: string }>;
};

const TIMELINE = ["requested", "reviewing", "matched", "completed"] as const;
type TimelineStatus = (typeof TIMELINE)[number];

function statusLabel(status: TimelineStatus | "declined") {
  if (status === "requested") return "요청 접수";
  if (status === "reviewing") return "검토 중";
  if (status === "matched") return "매칭 완료";
  if (status === "completed") return "완료";
  return "요청 반려";
}

export default async function TravelerRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = mockTravelerTripRequests.find((item) => item.id === id);
  if (!request) notFound();

  const currentIndex = request.status === "declined" ? -1 : TIMELINE.indexOf(request.status);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">Request #{request.id}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">요청 진행 상태</h1>
        <p className="text-sm text-muted-foreground">요청 메모: {request.note}</p>
      </header>

      <Card className="rounded-2xl border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">현재 상태</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-sm">
            {statusLabel(request.status)}
          </Badge>

          <ol className="space-y-3">
            {TIMELINE.map((status, index) => {
              const done = currentIndex >= index;
              return (
                <li key={status} className="flex items-center gap-3">
                  <span
                    className={[
                      "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                      done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>
                  <p className={done ? "text-foreground font-medium" : "text-muted-foreground"}>{statusLabel(status)}</p>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/mypage/requests">요청 목록으로</Link>
        </Button>
        {request.status === "matched" ? (
          <Button asChild>
            <Link href="/routes/mock">매칭된 루트 보기</Link>
          </Button>
        ) : null}
      </div>
    </main>
  );
}
