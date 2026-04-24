import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { GuardianTrustBadgeId } from "@/types/guardian-marketing";
import { cn } from "@/lib/utils";
import { CheckCircle2, Globe2, MessageCircleHeart, Zap } from "lucide-react";

const ICONS: Record<GuardianTrustBadgeId, typeof CheckCircle2> = {
  verified: CheckCircle2,
  language_checked: Globe2,
  reviewed: MessageCircleHeart,
  fast_response: Zap,
};

export function TrustBadgeRow({
  ids,
  className,
  size = "sm",
}: {
  ids: GuardianTrustBadgeId[];
  className?: string;
  size?: "sm" | "xs";
}) {
  const t = useTranslations("TrustBadgeLabels");
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {ids.map((id) => {
        const Icon = ICONS[id];
        return (
          <li key={id}>
            <Badge
              variant="secondary"
              className={cn(
                "gap-1 font-medium",
                size === "xs" ? "px-2 py-0 text-[10px]" : "px-2.5 py-0.5 text-xs",
              )}
            >
              <Icon className="size-3 opacity-80" aria-hidden />
              {t(id)}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
