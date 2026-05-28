/**
 * 루트 열람 이벤트 로깅 — 사용자 본인 투명성용.
 * 같은 세션에서 중복 로깅을 줄이기 위해 cookie 기반 디바운스.
 */
import { cookies } from "next/headers";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

const DEDUP_WINDOW_MIN = 10; // 같은 (route, user) 10분 내 재진입은 로깅 1건으로 침묵.

/** UUID 루트 진입 시 호출. mock 라우트는 호출하지 않는다. */
export async function logRouteViewEvent(input: {
  routeId: string;
  viewerUserId: string;
  source: "owner" | "shared-invite" | "ticket" | "custom-self" | "public-free";
  grantId?: string | null;
}): Promise<void> {
  if (!input.routeId || !input.viewerUserId) return;

  // cookie 기반 디바운스 — 짧은 시간 내 같은 (route_id, user_id) 중복 로깅 회피.
  // 다른 사용자/디바이스가 별도 cookie 영역을 가지므로 안전.
  const cookieStore = await cookies();
  const key = `route-view-${input.routeId}`;
  const last = cookieStore.get(key)?.value;
  if (last) {
    const lastMs = Number(last);
    if (Number.isFinite(lastMs) && Date.now() - lastMs < DEDUP_WINDOW_MIN * 60 * 1000) {
      return;
    }
  }

  const svc = createServiceRoleSupabase();
  if (!svc) return;

  await svc.from("route_post_view_events").insert({
    route_id: input.routeId,
    viewer_user_id: input.viewerUserId,
    source: input.source,
    grant_id: input.grantId ?? null,
  });

  // 쿠키 갱신 (Next.js 15: cookies()는 server에서 mutate 가능한 RequestCookies).
  try {
    cookieStore.set({
      name: key,
      value: String(Date.now()),
      httpOnly: false,
      sameSite: "lax",
      maxAge: DEDUP_WINDOW_MIN * 60,
      path: "/",
    });
  } catch {
    /* Read-only context (RSC outside route handler) — 무시. 디바운스가 약간 약해질 뿐. */
  }
}
