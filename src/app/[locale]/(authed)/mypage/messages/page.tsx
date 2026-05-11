import { getTranslations } from "next-intl/server";
import { BRAND } from "@/lib/constants";
import { getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { ThreadListClient } from "@/components/chat/thread-list-client";

export async function generateMetadata() {
  const t = await getTranslations("TravelerHub");
  return { title: `${t("navMessages")} | ${BRAND.name}` };
}

export default async function TravelerMessagesPage() {
  const t = await getTranslations("TravelerHub");
  const userId = await getSupabaseAuthUserIdOnly();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-text-strong text-xl font-semibold">{t("messagesTitle")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("messagesLead")}</p>
      </div>
      {userId ? (
        <ThreadListClient viewerRole="traveler" viewerUserId={userId} />
      ) : (
        <p className="text-sm text-muted-foreground">로그인 후 이용할 수 있어요.</p>
      )}
    </div>
  );
}
