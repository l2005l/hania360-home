// HaniaSport offline: the page from the network when there is one, from the cache when not.
const C = "haniasport-v3", FILES = ["/", "/manifest.webmanifest", "/icons/icon-192.png?v=2", "/install.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(C).then((c) => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match("/"))));
});
// Game reminders arrive as an empty push; the message waits on the server (HaniaDat's reminder service, kind "c").
self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    let m = null;
    try {
      const sub = await self.registration.pushManager.getSubscription();
      const r = await fetch("/api/shabbat/msg", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub && sub.endpoint }) });
      m = r.ok ? await r.json() : null;
    } catch { m = null; }
    if (!m || !m.title) m = { title: "⚽ HaniaSport", body: "המשחק מתחיל בקרוב.", url: "/" };
    await self.registration.showNotification(m.title, { body: m.body, icon: "/icons/icon-192.png?v=2", badge: "/icons/icon-192.png?v=2", lang: "he", dir: "rtl", tag: "sport", renotify: true, data: { url: "/" } });
  })());
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if (w.url.startsWith(self.location.origin) && "focus" in w) return w.focus();
    return self.clients.openWindow("/");
  }));
});
