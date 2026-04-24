"use client";

import {
  GuardianRequestOpenTrigger,
  type GuardianRequestOpenDetail,
} from "@/components/guardians/guardian-request-sheet";

export function SavedGuardianRequestButton({
  openDetail,
  label,
  className,
}: {
  openDetail: GuardianRequestOpenDetail;
  label: string;
  className?: string;
}) {
  return (
    <GuardianRequestOpenTrigger variant="outline" size="sm" className={className} openDetail={openDetail}>
      {label}
    </GuardianRequestOpenTrigger>
  );
}
