import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND } from "@/lib/constants";
import { MessageCircle } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return { title: `${t("navMessages")} | ${BRAND.name}` };
}

export default async function TravelerMessagesPage() {
  const t = await getTranslations("TravelerHub");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-text-strong text-xl font-semibold">{t("messagesTitle")}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{t("messagesLead")}</p>
      </div>
      <Card className="border-dashed border-border/80 rounded-2xl bg-white/60 py-0">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
            <MessageCircle className="size-7" aria-hidden />
          </div>
          <p className="text-foreground max-w-md text-sm leading-relaxed">{t("messagesEmpty")}</p>
          <p className="text-muted-foreground max-w-md text-xs leading-relaxed">{t("messagesMvp")}</p>
          <Button asChild className="rounded-xl">
            <Link href="/mypage/requests">{t("goToRequests")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
