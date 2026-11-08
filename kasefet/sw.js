// HaniaKasefet: the app shell offline (never any data: the vault is only in memory while open).
// Reminders arrive as an empty push; the message on the server says only "a reminder in the vault".
const C = "haniakasefet-v1", FILES = ["/", "/manifest.webmanifest", "/icons/icon-192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(C).then((c) => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match("/"))));
});
self.addEventListener("push", (e) => {
  e.waitUntil(self.registration.showNotification("🔐 תזכורת בכספת", { body: "יש משהו שכדאי לבדוק. פתחו את הכספת כדי לראות.", icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", lang: "he", dir: "rtl", tag: "kasefet", renotify: true, data: { url: "/#house" } }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if (w.url.startsWith(self.location.origin) && "focus" in w) return w.focus();
    return self.clients.openWindow("/#house");
  }));
});
