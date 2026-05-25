import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { BookingSuccessClient } from "./booking-success-client";
import { BRAND } from "@/lib/constants";
import type { BookingRequestPayload } from "@/types/domain";
import { getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata() {
  const t = await getTranslations("BookingSuccess");
  const tBook = await getTranslations("Book");
  return {
    title: `${t("title")} | ${BRAND.name}`,
    description: tBook("metaDescription"),
  };
}

export default async function BookSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const t = await getTranslations("Book");
  const { id } = await searchParams;

  // sessionStorage가 없는 경우(새로고침·직접 진입) 서버 폴백.
  // PII 보호: 로그인 + 본인 소유(traveler_user_id) 예약일 때만 서버에서 요약을 내려준다.
  let serverPayload: BookingRequestPayload | null = null;
  let serverId: string | null = null;
  if (id && UUID_RE.test(id)) {
    const uid = await getSupabaseAuthUserIdOnly();
    const sb = uid ? createServiceRoleSupabase() : null;
    if (uid && sb) {
      const { data } = await sb
        .from("bookings")
        .select("id, request_payload")
        .eq("id", id)
        .eq("traveler_user_id", uid)
        .maybeSingle();
      if (data?.request_payload) {
        serverPayload = data.request_payload as BookingRequestPayload;
        serverId = data.id as string;
      }
    }
  }

  return (
    <Suspense fallback={<p className="text-muted-foreground mx-auto max-w-2xl p-8 text-sm">{t("loading")}</p>}>
      <BookingSuccessClient serverPayload={serverPayload} serverId={serverId} />
    </Suspense>
  );
}
