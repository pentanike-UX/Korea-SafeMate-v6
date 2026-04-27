import { GuardianRouteDeliveryForm } from "@/components/guardian/guardian-route-delivery-form";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

type Props = {
  searchParams: Promise<{
    booking_id?: string;
  }>;
};

export default async function GuardianRouteNewPage({ searchParams }: Props) {
  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">루트 전달</h1>
        <p className="text-sm text-muted-foreground">인증 구성이 없어 현재 저장할 수 없습니다.</p>
      </main>
    );
  }

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">루트 전달</h1>
        <p className="text-sm text-muted-foreground">로그인 후 다시 시도해 주세요.</p>
      </main>
    );
  }

  const [sp, bookingsRes, spotsRes] = await Promise.all([
    searchParams,
    sb
      .from("bookings")
      .select("id, status, tier, requested_start, revision_count, max_revisions")
      .eq("guardian_user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(30),
    sb
      .from("spot_catalog")
      .select("id, name_ko, name_en, category, avg_stay_min")
      .eq("is_active", true)
      .order("name_ko", { ascending: true })
      .limit(200),
  ]);

  const initialBookingId = typeof sp.booking_id === "string" ? sp.booking_id : null;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">가디언 루트 전달</h1>
        <p className="text-sm text-muted-foreground">
          예약(booking_id)에 연결된 커스텀 루트를 생성하고 `route_spots`를 순서대로 저장합니다.
        </p>
      </div>

      <GuardianRouteDeliveryForm
        bookings={bookingsRes.data ?? []}
        spots={spotsRes.data ?? []}
        initialBookingId={initialBookingId}
      />
    </main>
  );
}
