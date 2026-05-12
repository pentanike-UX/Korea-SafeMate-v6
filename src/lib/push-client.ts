/**
 * 브라우저 측 Web Push 구독 헬퍼.
 *  - SW 등록(/sw.js)
 *  - 권한 요청
 *  - 구독 후 /api/notifications/push/subscribe 로 서버에 저장
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function ensurePushSubscribed(vapidPublicKey: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;
  if (!("Notification" in window)) return false;
  if (!vapidPublicKey) return false;

  // 권한 확인 — 거부 상태에선 진행하지 않음
  if (Notification.permission === "denied") return false;
  if (Notification.permission !== "granted") {
    const res = await Notification.requestPermission().catch(() => "default" as NotificationPermission);
    if (res !== "granted") return false;
  }

  // SW 등록
  const reg = await navigator.serviceWorker.register("/sw.js").catch(() => null);
  if (!reg) return false;
  await navigator.serviceWorker.ready;

  // 기존 구독 확인
  const existing = await reg.pushManager.getSubscription();
  const appServerKey = urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource;
  const sub =
    existing ??
    (await reg.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      })
      .catch(() => null));

  if (!sub) return false;

  // 서버에 저장(멱등 — endpoint unique upsert)
  const json = sub.toJSON();
  await fetch("/api/notifications/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      user_agent: navigator.userAgent,
    }),
  }).catch(() => {});

  return true;
}
