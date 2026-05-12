import { BRAND } from "@/lib/constants";
import { getSessionUserId } from "@/lib/supabase/server-user";
import { ThreadListClient } from "@/components/chat/thread-list-client";

export const metadata = {
  title: `메시지함 | ${BRAND.name}`,
};

export default async function GuardianMessagesPage() {
  const userId = await getSessionUserId();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-text-strong text-xl font-semibold">메시지함</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          여행자로부터 받은 문의를 확인하고 답변하세요.
        </p>
      </div>
      {userId ? (
        <ThreadListClient viewerRole="guardian" viewerUserId={userId} />
      ) : (
        <p className="text-sm text-muted-foreground">로그인 후 이용할 수 있어요.</p>
      )}
    </div>
  );
}
