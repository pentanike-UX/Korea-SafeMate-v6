/**
 * Server-side Web Push 전송.
 * - VAPID 키 미설정 시 silent skip (dev/local 호환).
 * - 410/404 endpoint 만료 시 자동 정리.
 *
 * 사용 예: void sendInboundMessagePush(otherUserId, { title, body, href }).
 */

import webpush from "web-push";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

type PushPayload = {
  title: string;
  body: string;
  href?: string;
  tag?: string;
};

let _initialized = false;
function ensureInit(): boolean {
  if (_initialized) return true;
  const pub = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const priv = process.env.VAPID_PRIVATE_KEY ?? "";
  const subject = process.env.VAPID_SUBJECT ?? "mailto:ops@korea-safemate.invalid";
  if (!pub || !priv) return false;
  try {
    webpush.setVapidDetails(subject, pub, priv);
    _initialized = true;
    return true;
  } catch (e) {
    console.error("[push-server] setVapidDetails", e);
    return false;
  }
}

export async function sendInboundMessagePush(toUserId: string, payload: PushPayload): Promise<void> {
  if (!toUserId) return;
  if (!ensureInit()) return; // VAPID 미설정 — silent skip

  const svc = createServiceRoleSupabase();
  if (!svc) return;

  const { data: subs } = await svc
    .from("user_push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", toUserId);

  if (!subs || subs.length === 0) return;

  const body = JSON.stringify(payload);
  const stale: string[] = [];

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint as string, keys: { p256dh: s.p256dh as string, auth: s.auth as string } },
          body,
          { TTL: 60 },
        );
      } catch (e) {
        const err = e as { statusCode?: number };
        if (err.statusCode === 404 || err.statusCode === 410) {
          stale.push(s.endpoint as string);
        } else {
          console.error("[push-server] sendNotification", err.statusCode, e);
        }
      }
    }),
  );

  if (stale.length > 0) {
    await svc.from("user_push_subscriptions").delete().in("endpoint", stale);
  }
}
