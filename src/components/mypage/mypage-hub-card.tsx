import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** 여행자·하루이 마이페이지 허브용 카드 — 상·하 여백이 있는 기본 패딩. */
export function MypageHubCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn("rounded-2xl border-border/60 shadow-[var(--shadow-sm)]", className)}
      {...props}
    />
  );
}

export function MypageHubCardHeader({ className, ...props }: React.ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn("pb-2", className)} {...props} />;
}

export function MypageHubCardContent({ className, ...props }: React.ComponentProps<typeof CardContent>) {
  return <CardContent className={cn("space-y-3 text-sm", className)} {...props} />;
}

/** 요약 KPI 등 헤더만 있는 카드 */
export function MypageHubStatCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <MypageHubCard className={className} {...props} />
  );
}

export function MypageHubStatCardHeader({ className, ...props }: React.ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn("gap-1 pb-2", className)} {...props} />;
}
