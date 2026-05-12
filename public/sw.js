/* Korea SafeMate — Service Worker for Web Push */
/* eslint-disable no-restricted-globals */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "새 메시지", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "새 메시지";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/images/brand/haru-mark.png",
    badge: payload.badge || "/images/brand/haru-mark.png",
    tag: payload.tag || "ksm-inbound",
    renotify: true,
    data: { href: payload.href || "/mypage/messages" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/mypage/messages";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
      for (const c of all) {
        if (c.url.includes(href)) return c.focus();
      }
      return self.clients.openWindow(href);
    }),
  );
});
