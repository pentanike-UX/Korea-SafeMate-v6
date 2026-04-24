import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getGuardianSeedRow } from "@/lib/dev/mock-guardian-auth";
import { createBlankRoutePost } from "@/lib/guardian-route-post-template";
import { getSessionUserId } from "@/lib/supabase/server-user";
import { GuardianRoutePostEditor } from "@/components/guardian/guardian-route-post-editor";
import { mockGuardians } from "@/data/mock";

export default async function MypageGuardianNewRoutePostPage() {
  const locale = await getLocale();
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    redirect({ href: "/login", locale });
  }
  const uid = sessionUserId as string;
  const seed = getGuardianSeedRow(uid);
  const display_name = seed?.display_name ?? mockGuardians.find((g) => g.user_id === uid)?.display_name ?? "Guardian";
  const initial = createBlankRoutePost({ user_id: uid, display_name });
  return <GuardianRoutePostEditor mode="create" initialPost={initial} />;
}
